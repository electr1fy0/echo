import { Hono } from "hono";
import { and, eq } from "drizzle-orm";

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
