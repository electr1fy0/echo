import { Hono } from "hono";
import { eq, sql } from "drizzle-orm";

import { schema } from "../db";
import { optionalAuth } from "../middleware/auth";
import { getPostItems, getReplies, listChambers, mapChamber, mapReplyItem } from "../services/questions";
import { searchUsers } from "../services/questions";
import type { AppEnv } from "../types/app";

export const searchRoutes = new Hono<AppEnv>();

searchRoutes.use("*", optionalAuth);

searchRoutes.get("/", async (c) => {
  const query = c.req.query("q") ?? "";
  if (!query) {
    return c.json({ chambers: [], posts: [], replies: [], users: [] });
  }

  const db = c.get("db");
  const currentUser = c.get("user");

  const [chambers, posts, replies, users] = await Promise.all([
    listChambers(db, currentUser, query).then((rows) => rows.slice(0, 5).map(mapChamber)),
    getPostItems(db, currentUser, { limit: 5, offset: 0, query }),
    db.select({
      uid: schema.replies.uid,
      content: schema.replies.content,
      timeCreated: schema.replies.timeCreated,
      postUid: schema.replies.postUid,
      parentReplyUid: schema.replies.parentReplyUid,
      isAnonymous: schema.replies.isAnonymous,
      authorUsername: schema.replies.author,
      authorAvatar: sql<string>`coalesce(${schema.users.avatar}, '')`,
      authorBio: schema.users.bio,
      authorPosted: schema.users.posted,
      authorAnswered: schema.users.answered,
      authorReputation: sql<number>`coalesce(${schema.users.reputation}, 0)`,
      authorDeletedAt: schema.users.deletedAt,
      upvotes: schema.replies.upvotesCount,
      isUpvoted: sql<boolean>`exists (
        select 1 from reply_upvotes rv
        where rv.reply_uid = ${schema.replies.uid}
          and rv.username = ${currentUser || ""}
      )`,
      acceptedAnswerUid: sql<string | null>`null`,
    })
    .from(schema.replies)
    .leftJoin(schema.users, eq(schema.users.username, schema.replies.author))
    .where(sql`${schema.replies.searchVector} @@ plainto_tsquery('english', ${query})`)
    .limit(5)
    .then((rows) => rows.map(mapReplyItem)),
    searchUsers(db, query),
  ]);

  return c.json({ chambers, questions: posts, replies, users });
});
