import { Hono } from "hono";
import { and, asc, eq } from "drizzle-orm";

import { schema } from "../db";
import { ApiError } from "../lib/errors";
import { requireAuth, optionalAuth } from "../middleware/auth";
import { listChambers, mapChamber } from "../services/questions";
import type { AppEnv } from "../types/app";

export const chamberRoutes = new Hono<AppEnv>();

chamberRoutes.get("/", optionalAuth, async (c) => {
  const rows = await listChambers(c.get("db"), c.get("user"), c.req.query("q") ?? "");
  return c.json(rows.map(mapChamber));
});

chamberRoutes.use("*", requireAuth);


chamberRoutes.post("/", async (c) => {
  const body = (await c.req.json()) as {
    name?: string;
    description?: string;
    colorIndex?: number;
  };
  const [created] = await c.get("db").insert(schema.chambers).values({
    name: body.name ?? "",
    description: body.description ?? "",
    creatorUsername: c.get("user"),
    colorIndex: body.colorIndex ?? 0,
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
        { id: "price", type: "currency", label: "Price (₹)", required: true },
        { id: "condition", type: "select", label: "Condition", options: ["Brand New", "Like New", "Used", "Digital/PDF"], required: true },
        { id: "category", type: "select", label: "Category", options: ["Textbooks", "Electronics", "Lab Coats / Gear", "Hostel Essentials", "Other"], required: false }
      ],
    },
    {
      chamberUid: created.uid,
      name: "carpools",
      icon: "car",
      schema: [
        { id: "departure", type: "text", label: "From", required: true },
        { id: "destination", type: "text", label: "To", required: true },
        { id: "datetime", type: "datetime", label: "Departure Time", required: true },
        { id: "seats", type: "number", label: "Seats Available", required: true }
      ],
    },
    {
      chamberUid: created.uid,
      name: "study-partners",
      icon: "users",
      schema: [
        { id: "slots", type: "number", label: "Slots Needed", required: true },
        { id: "grade_target", type: "select", label: "Target Grade", options: ["A+ / Perfect Score", "Pass", "Just for Fun"], required: false },
        { id: "workstyle", type: "select", label: "Workstyle", options: ["In-person", "Online", "Hybrid"], required: false }
      ],
    },
    {
      chamberUid: created.uid,
      name: "lost-and-found",
      icon: "search",
      schema: [
        { id: "type", type: "select", label: "Status", options: ["Lost", "Found"], required: true },
        { id: "item", type: "text", label: "Item Description", required: true },
        { id: "location", type: "text", label: "Location Lost/Found", required: false }
      ],
    },
    {
      chamberUid: created.uid,
      name: "resources",
      icon: "book-open",
      schema: [
        { id: "file", type: "file", label: "Resource File", required: true },
        { id: "course", type: "text", label: "Course Code", required: false },
        { id: "notes", type: "text", label: "Description / Notes", required: false }
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
    timeCreated: created.createdAt?.toISOString() ?? null,
  }, 201);
});

chamberRoutes.delete("/", async (c) => {
  const body = (await c.req.json()) as { name?: string };
  await c.get("db").delete(schema.chambers).where(
    and(eq(schema.chambers.creatorUsername, c.get("user")), eq(schema.chambers.name, body.name ?? "")),
  );
  return c.json({ message: "chamber deleted" });
});

chamberRoutes.patch("/:uid", async (c) => {
  const uid = c.req.param("uid");
  const body = (await c.req.json()) as { name?: string; description?: string; colorIndex?: number };
  if (!body.name || !body.description) {
    throw new ApiError(400, "name and description are required");
  }

  const [chamber] = await c.get("db").select({
    creatorUsername: schema.chambers.creatorUsername,
  }).from(schema.chambers).where(eq(schema.chambers.uid, uid)).limit(1);

  if (!chamber) {
    throw new ApiError(404, "chamber not found");
  }
  if (chamber.creatorUsername !== c.get("user")) {
    throw new ApiError(403, "unauthorized");
  }

  try {
    await c.get("db").update(schema.chambers).set({
      name: body.name,
      description: body.description,
      colorIndex: body.colorIndex ?? 0,
    }).where(eq(schema.chambers.uid, uid));
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
  const body = (await c.req.json()) as {
    name?: string;
    icon?: string;
    schema?: any[];
  };
  if (!body.name) {
    throw new ApiError(400, "channel name is required");
  }

  const [created] = await c.get("db").insert(schema.channels).values({
    chamberUid: uid,
    name: body.name.toLowerCase().replace(/\s+/g, "-"),
    icon: body.icon ?? "hash",
    schema: body.schema ?? [],
  }).returning();

  return c.json(created, 201);
});
