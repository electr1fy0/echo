import { Hono } from "hono";
import { and, asc, eq, inArray } from "drizzle-orm";

import { schema } from "../db";
import { ApiError } from "../lib/errors";
import { requireAuth, optionalAuth } from "../middleware/auth";
import { listChambers, mapChamber } from "../services/questions";
import { safeParse, createChamberSchema, updateChamberSchema, createChannelSchema, updateChannelSchema, deleteChamberSchema } from "../lib/validation";
import type { AppEnv } from "../types/app";

export const chamberRoutes = new Hono<AppEnv>();

chamberRoutes.get("/", optionalAuth, async (c) => {
  const rows = await listChambers(c.get("db"), c.get("user"), c.req.query("q") ?? "");
  return c.json(rows.map(mapChamber));
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


chamberRoutes.post("/", async (c) => {
  const body = safeParse(createChamberSchema, await c.req.json());
  const [created] = await c.get("db").insert(schema.chambers).values({
    name: body.name,
    description: body.description,
    creatorUsername: c.get("user"),
    colorIndex: body.colorIndex ?? 0,
    picture: body.picture ?? null,
    icon: body.icon ?? null,
  }).returning({ uid: schema.chambers.uid, createdAt: schema.chambers.createdAt });

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
        { id: "price", type: "currency", label: "Price", required: true }
      ],
    },
    {
      chamberUid: created.uid,
      name: "carpools",
      icon: "car",
      schema: [
        { id: "datetime", type: "datetime", label: "Departure Time", required: true },
        { id: "pickup", type: "location", label: "Pickup From", required: true },
        { id: "dropoff", type: "location", label: "Dropoff To", required: true }
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
        { id: "location", type: "location", label: "Location", required: false }
      ],
    },
    {
      chamberUid: created.uid,
      name: "resources",
      icon: "book-open",
      schema: [
        { id: "file", type: "file", label: "Resource File", required: true }
      ],
    }
  ];

  await c.get("db").insert(schema.channels).values(defaultChannels);

  return c.json({
    uid: created.uid,
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

chamberRoutes.delete("/", async (c) => {
  const body = safeParse(deleteChamberSchema, await c.req.json());
  const deleted = await c.get("db").delete(schema.chambers).where(
    and(eq(schema.chambers.creatorUsername, c.get("user")), eq(schema.chambers.name, body.name)),
  ).returning({ uid: schema.chambers.uid });

  if (!deleted.length) {
    throw new ApiError(404, "chamber not found or not authorized");
  }

  return c.json({ message: "chamber deleted" });
});

chamberRoutes.patch("/:uid", async (c) => {
  const uid = c.req.param("uid");
  const body = safeParse(updateChamberSchema, await c.req.json());

  const [chamber] = await c.get("db").select({
    creatorUsername: schema.chambers.creatorUsername,
  }).from(schema.chambers).where(eq(schema.chambers.uid, uid)).limit(1);

  if (!chamber) {
    throw new ApiError(404, "chamber not found");
  }
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

  try {
    await c.get("db").update(schema.chambers).set(updates).where(eq(schema.chambers.uid, uid));
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      throw new ApiError(409, "chamber name already exists");
    }
    throw error;
  }

  return c.json({ message: "chamber updated" });
});

chamberRoutes.post("/:uid/join", async (c) => {
  await c.get("db").insert(schema.chamberMembers).values({
    chamberUid: c.req.param("uid"),
    username: c.get("user"),
  }).onConflictDoNothing();

  return c.json({ message: "joined chamber" });
});

chamberRoutes.post("/:uid/leave", async (c) => {
  await c.get("db").delete(schema.chamberMembers).where(
    and(eq(schema.chamberMembers.chamberUid, c.req.param("uid")), eq(schema.chamberMembers.username, c.get("user"))),
  );
  return c.json({ message: "left chamber" });
});

// Channels endpoints
chamberRoutes.get("/:uid/channels", async (c) => {
  const uid = c.req.param("uid");
  const rows = await c.get("db")
    .select()
    .from(schema.channels)
    .where(eq(schema.channels.chamberUid, uid))
    .orderBy(asc(schema.channels.createdAt));
  return c.json(rows);
});

chamberRoutes.post("/:uid/channels", async (c) => {
  const uid = c.req.param("uid");

  // Check if user is the creator of the chamber
  const [chamber] = await c.get("db")
    .select({ creatorUsername: schema.chambers.creatorUsername })
    .from(schema.chambers)
    .where(eq(schema.chambers.uid, uid))
    .limit(1);

  if (!chamber) {
    throw new ApiError(404, "chamber not found");
  }
  if (chamber.creatorUsername !== c.get("user")) {
    throw new ApiError(403, "only chamber creator can create channels");
  }

  const body = safeParse(createChannelSchema, await c.req.json());

  const [created] = await c.get("db").insert(schema.channels).values({
    chamberUid: uid,
    name: body.name.toLowerCase().replace(/\s+/g, "-"),
    icon: body.icon ?? "hash",
    schema: body.schema ?? [],
  }).returning();

  return c.json(created, 201);
});

chamberRoutes.patch("/:uid/channels/:channelUid", async (c) => {
  const uid = c.req.param("uid");
  const channelUid = c.req.param("channelUid");

  // Check if user is the creator of the chamber
  const [chamber] = await c.get("db")
    .select({ creatorUsername: schema.chambers.creatorUsername })
    .from(schema.chambers)
    .where(eq(schema.chambers.uid, uid))
    .limit(1);

  if (!chamber) {
    throw new ApiError(404, "chamber not found");
  }
  if (chamber.creatorUsername !== c.get("user")) {
    throw new ApiError(403, "only chamber creator can edit channels");
  }

  const body = safeParse(updateChannelSchema, await c.req.json());

  const updates: Record<string, any> = {};
  if (body.name) updates.name = body.name.toLowerCase().replace(/\s+/g, "-");
  if (body.icon) updates.icon = body.icon;
  if (body.schema !== undefined) updates.schema = body.schema;

  const [updated] = await c.get("db")
    .update(schema.channels)
    .set(updates)
    .where(and(eq(schema.channels.uid, channelUid), eq(schema.channels.chamberUid, uid)))
    .returning();

  if (!updated) {
    throw new ApiError(404, "channel not found");
  }

  return c.json(updated);
});

chamberRoutes.delete("/:uid/channels/:channelUid", async (c) => {
  const uid = c.req.param("uid");
  const channelUid = c.req.param("channelUid");

  // Check if user is the creator of the chamber
  const [chamber] = await c.get("db")
    .select({ creatorUsername: schema.chambers.creatorUsername })
    .from(schema.chambers)
    .where(eq(schema.chambers.uid, uid))
    .limit(1);

  if (!chamber) {
    throw new ApiError(404, "chamber not found");
  }
  if (chamber.creatorUsername !== c.get("user")) {
    throw new ApiError(403, "only chamber creator can delete channels");
  }

  // Prevent deleting the default 'discussion' channel
  const [channel] = await c.get("db")
    .select()
    .from(schema.channels)
    .where(eq(schema.channels.uid, channelUid))
    .limit(1);

  if (channel && (channel.name === "discussion" || channel.name === "discussions")) {
    throw new ApiError(400, "cannot delete default discussion channel");
  }

  await c.get("db")
    .delete(schema.channels)
    .where(and(eq(schema.channels.uid, channelUid), eq(schema.channels.chamberUid, uid)));

  return c.json({ message: "channel deleted" });
});
