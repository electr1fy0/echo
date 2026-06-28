import { Hono } from "hono";
import { and, desc, eq } from "drizzle-orm";

import { schema } from "../db";
import { ApiError } from "../lib/errors";
import { requireAuth } from "../middleware/auth";
import { inMemoryRateLimit } from "../middleware/rateLimit";
import { getPostItems } from "../services/questions";
import { parsePagination } from "../lib/utils";
import type { AppEnv } from "../types/app";

const bookmarkLimiter = inMemoryRateLimit("bookmark", 30, 60);

export const bookmarkRoutes = new Hono<AppEnv>();

bookmarkRoutes.get("/", requireAuth, async (c) => {
  const db = c.get("db");
  const currentUser = c.get("user");
  const { limit, offset } = parsePagination(c.req.query());

  const bookmarkSubquery = db
    .select({ postUid: schema.bookmarks.postUid })
    .from(schema.bookmarks)
    .where(eq(schema.bookmarks.username, currentUser));

  const bookmarkedUids = await bookmarkSubquery;
  const uids = bookmarkedUids.map((b) => b.postUid);

  if (uids.length === 0) {
    return c.json([]);
  }

  const query = c.req.query("q");

  return c.json(await getPostItems(db, currentUser, {
    limit,
    offset,
    query: query ?? undefined,
    uids,
  }));
});

bookmarkRoutes.post("/:postUid", requireAuth, bookmarkLimiter, async (c) => {
  const db = c.get("db");
  const currentUser = c.get("user");
  const postUid = c.req.param("postUid");

  const [existing] = await db
    .select()
    .from(schema.bookmarks)
    .where(
      and(
        eq(schema.bookmarks.username, currentUser),
        eq(schema.bookmarks.postUid, postUid),
      ),
    )
    .limit(1);

  if (existing) {
    return c.json({ message: "already bookmarked" });
  }

  await db.insert(schema.bookmarks).values({
    username: currentUser,
    postUid,
  });

  return c.json({ message: "bookmarked" }, 201);
});

bookmarkRoutes.delete("/:postUid", requireAuth, bookmarkLimiter, async (c) => {
  const db = c.get("db");
  const postUid = c.req.param("postUid");

  await db.delete(schema.bookmarks).where(
    and(
      eq(schema.bookmarks.username, c.get("user")),
      eq(schema.bookmarks.postUid, postUid),
    ),
  );

  return c.json({ message: "unbookmarked" });
});
