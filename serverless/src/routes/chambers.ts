import { Hono } from "hono";
import { and, asc, eq, inArray, sql } from "drizzle-orm";

import { schema } from "../db";
import { ApiError } from "../lib/errors";
import { requireAuth, optionalAuth } from "../middleware/auth";
import { inMemoryRateLimit } from "../middleware/rateLimit";
import { listChambers, mapChamber, resolveChamber, generateChamberSlug } from "../services/questions";
import { safeParse, createChamberSchema, updateChamberSchema, createChannelSchema, updateChannelSchema, deleteChamberSchema } from "../lib/validation";
import type { AppEnv } from "../types/app";

const chamberCreateLimiter = inMemoryRateLimit("create-chamber", 3, 60);
const chamberUpdateLimiter = inMemoryRateLimit("update-chamber", 5, 60);
const chamberJoinLimiter = inMemoryRateLimit("join-chamber", 10, 60);

export const chamberRoutes = new Hono<AppEnv>();

chamberRoutes.get("/", optionalAuth, async (c) => {
  const rows = await listChambers(c.get("db"), c.get("user"), c.req.query("q") ?? "");
  return c.json(rows.map(mapChamber));
});

chamberRoutes.get("/:uid", optionalAuth, async (c) => {
  const db = c.get("db");
  const currentUser = c.get("user");
  const identifier = c.req.param("uid");
  const chamber = await resolveChamber(db, identifier);

  const [row] = await db
    .select({
      uid: schema.chambers.uid,
      slug: schema.chambers.slug,
      name: schema.chambers.name,
      description: sql<string>`coalesce(${schema.chambers.description}, '')`,
      creatorUsername: schema.chambers.creatorUsername,
      colorIndex: schema.chambers.colorIndex,
      timeCreated: schema.chambers.createdAt,
      picture: schema.chambers.picture,
      icon: schema.chambers.icon,
      memberCount: sql<number>`(
        select count(*)::int from chamber_members cm
        where cm.chamber_uid = ${schema.chambers.uid}
      )`,
      isJoined: sql<boolean>`exists(
        select 1 from chamber_members cm
        where cm.chamber_uid = ${schema.chambers.uid}
          and cm.username = ${currentUser || ""}
      )`,
    })
    .from(schema.chambers)
    .where(eq(schema.chambers.uid, chamber.uid))
    .limit(1);

  if (!row) {
    throw new ApiError(404, "chamber not found");
  }

  return c.json(row);
});

chamberRoutes.get("/all-channels", optionalAuth, async (c) => {
  const db = c.get("db");
  const user = c.get("user");
  const joinedOnly = c.req.query("joined_only") === "true";

  let conditions = [];
  if (joinedOnly && user) {
    const memberChambers = db
      .select({ chamberUid: schema.chamberMembers.chamberUid })
      .from(schema.chamberMembers)
      .where(eq(schema.chamberMembers.username, user));
    conditions.push(inArray(schema.channels.chamberUid, memberChambers));
  }

  const allChans = await db
    .select({
      uid: schema.channels.uid,
      chamberUid: schema.channels.chamberUid,
      name: schema.channels.name,
      icon: schema.channels.icon,
    })
    .from(schema.channels)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(schema.channels.name));

  return c.json(allChans);
});

chamberRoutes.use("*", requireAuth);


chamberRoutes.post("/", chamberCreateLimiter, async (c) => {
  const body = safeParse(createChamberSchema, await c.req.json());
  const db = c.get("db");
  const slug = await generateChamberSlug(db, body.name);
  const [created] = await db.insert(schema.chambers).values({
    slug,
    name: body.name,
    description: body.description,
    creatorUsername: c.get("user"),
    colorIndex: body.colorIndex ?? 0,
    picture: body.picture ?? null,
    icon: body.icon ?? null,
  }).returning({ uid: schema.chambers.uid, slug: schema.chambers.slug, createdAt: schema.chambers.createdAt });

  await c.get("db").insert(schema.chamberMembers).values({
    chamberUid: created.uid,
    username: c.get("user"),
  });

  // Automatically create default channels for the new chamber
  const defaultChannels = [
    {
      chamberUid: created.uid,
      name: "discussion",
      icon: "message-square",
      schema: [],
    },
    {
      chamberUid: created.uid,
      name: "marketplace",
      icon: "shopping-bag",
      schema: [
        { id: "price", type: "currency", label: "Price", required: 1 }
      ],
    },
    {
      chamberUid: created.uid,
      name: "carpools",
      icon: "car",
      schema: [
        { id: "datetime", type: "datetime", label: "Departure Time", required: 1 },
        { id: "pickup", type: "location", label: "Pickup From", required: 1 },
        { id: "dropoff", type: "location", label: "Dropoff To", required: 1 }
      ],
    },
    {
      chamberUid: created.uid,
      name: "study-partners",
      icon: "users",
      schema: [],
    },
    {
      chamberUid: created.uid,
      name: "lost-and-found",
      icon: "search",
      schema: [
        { id: "location", type: "location", label: "Location", required: 0 }
      ],
    },
    {
      chamberUid: created.uid,
      name: "resources",
      icon: "book-open",
      schema: [
        { id: "file", type: "file", label: "Resource File", required: 1 }
      ],
    }
  ];

  await c.get("db").insert(schema.channels).values(defaultChannels);

  return c.json({
    uid: created.uid,
    slug: created.slug,
    name: body.name ?? "",
    description: body.description ?? "",
    creatorUsername: c.get("user"),
    memberCount: 1,
    isJoined: true,
    colorIndex: body.colorIndex ?? 0,
    picture: body.picture ?? null,
    icon: body.icon ?? null,
    timeCreated: created.createdAt?.toISOString() ?? null,
  }, 201);
});

chamberRoutes.delete("/", chamberCreateLimiter, async (c) => {
  const body = safeParse(deleteChamberSchema, await c.req.json());
  const deleted = await c.get("db").delete(schema.chambers).where(
    and(eq(schema.chambers.creatorUsername, c.get("user")), eq(schema.chambers.name, body.name)),
  ).returning({ uid: schema.chambers.uid });

  if (!deleted.length) {
    throw new ApiError(404, "chamber not found or not authorized");
  }

  return c.json({ message: "chamber deleted" });
});

chamberRoutes.patch("/:uid", chamberUpdateLimiter, async (c) => {
  const identifier = c.req.param("uid");
  const body = safeParse(updateChamberSchema, await c.req.json());
  const db = c.get("db");

  const chamber = await resolveChamber(db, identifier);
  if (chamber.creatorUsername !== c.get("user")) {
    throw new ApiError(403, "unauthorized");
  }

  const updates: Record<string, unknown> = {
    name: body.name,
    description: body.description,
    colorIndex: body.colorIndex ?? 0,
  };
  if (body.picture !== undefined) updates.picture = body.picture;
  if (body.icon !== undefined) updates.icon = body.icon;

  // Regenerate slug if name changed
  if (body.name && body.name !== chamber.name) {
    updates.slug = await generateChamberSlug(db, body.name, chamber.uid);
  }

  try {
    await db.update(schema.chambers).set(updates).where(eq(schema.chambers.uid, chamber.uid));
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new ApiError(409, "chamber name already exists");
    }
    throw error;
  }

  return c.json({ message: "chamber updated" });
});

chamberRoutes.post("/:uid/join", chamberJoinLimiter, async (c) => {
  const db = c.get("db");
  const chamber = await resolveChamber(db, c.req.param("uid"));
  await db.insert(schema.chamberMembers).values({
    chamberUid: chamber.uid,
    username: c.get("user"),
  }).onConflictDoNothing();

  return c.json({ message: "joined chamber" });
});

chamberRoutes.post("/:uid/leave", chamberJoinLimiter, async (c) => {
  const db = c.get("db");
  const chamber = await resolveChamber(db, c.req.param("uid"));
  await db.delete(schema.chamberMembers).where(
    and(eq(schema.chamberMembers.chamberUid, chamber.uid), eq(schema.chamberMembers.username, c.get("user"))),
  );
  return c.json({ message: "left chamber" });
});

// Channels endpoints
chamberRoutes.get("/:uid/channels", async (c) => {
  const db = c.get("db");
  const chamber = await resolveChamber(db, c.req.param("uid"));
  const rows = await db
    .select()
    .from(schema.channels)
    .where(eq(schema.channels.chamberUid, chamber.uid))
    .orderBy(asc(schema.channels.createdAt));
  return c.json(rows);
});

chamberRoutes.post("/:uid/channels", chamberUpdateLimiter, async (c) => {
  const db = c.get("db");
  const chamber = await resolveChamber(db, c.req.param("uid"));

  if (chamber.creatorUsername !== c.get("user")) {
    throw new ApiError(403, "only chamber creator can create channels");
  }

  const body = safeParse(createChannelSchema, await c.req.json());

  const [created] = await db.insert(schema.channels).values({
    chamberUid: chamber.uid,
    name: body.name.toLowerCase().replace(/\s+/g, "-"),
    icon: body.icon ?? "hash",
    schema: body.schema ?? [],
  }).returning();

  return c.json(created, 201);
});

chamberRoutes.patch("/:uid/channels/:channelUid", chamberUpdateLimiter, async (c) => {
  const channelUid = c.req.param("channelUid");
  const db = c.get("db");

  const chamber = await resolveChamber(db, c.req.param("uid"));

  if (chamber.creatorUsername !== c.get("user")) {
    throw new ApiError(403, "only chamber creator can edit channels");
  }

  const body = safeParse(updateChannelSchema, await c.req.json());

  const updates: Record<string, any> = {};
  if (body.name) updates.name = body.name.toLowerCase().replace(/\s+/g, "-");
  if (body.icon) updates.icon = body.icon;
  if (body.schema !== undefined) updates.schema = body.schema;

  const [updated] = await db
    .update(schema.channels)
    .set(updates)
    .where(and(eq(schema.channels.uid, channelUid), eq(schema.channels.chamberUid, chamber.uid)))
    .returning();

  if (!updated) {
    throw new ApiError(404, "channel not found");
  }

  return c.json(updated);
});

chamberRoutes.delete("/:uid/channels/:channelUid", chamberUpdateLimiter, async (c) => {
  const channelUid = c.req.param("channelUid");
  const db = c.get("db");

  const chamber = await resolveChamber(db, c.req.param("uid"));

  if (chamber.creatorUsername !== c.get("user")) {
    throw new ApiError(403, "only chamber creator can delete channels");
  }

  // Prevent deleting the default 'discussion' channel
  const [channel] = await db
    .select()
    .from(schema.channels)
    .where(eq(schema.channels.uid, channelUid))
    .limit(1);

  if (channel && (channel.name === "discussion" || channel.name === "discussions")) {
    throw new ApiError(400, "cannot delete default discussion channel");
  }

  await db
    .delete(schema.channels)
    .where(and(eq(schema.channels.uid, channelUid), eq(schema.channels.chamberUid, chamber.uid)));

  return c.json({ message: "channel deleted" });
});
