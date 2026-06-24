import { Hono } from "hono";
import { eq, ilike, sql } from "drizzle-orm";

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
      authorUsername: schema.replies.author,
      authorAvatar: sql<string>`coalesce(${schema.users.avatar}, '')`,
      authorBio: schema.users.bio,
      authorPosted: schema.users.posted,
      authorAnswered: schema.users.answered,
      authorReputation: sql<number>`(
        coalesce((select sum(p2."upvotes_count") from "posts" p2 where p2.author = ${schema.users.username}), 0) * 10
        + coalesce((select sum(r2."upvotes_count") from "replies" r2 where r2.author = ${schema.users.username}), 0) * 15
        + (select count(*)::int from "posts" p3 where p3.author = ${schema.users.username}) * 5
        + (select count(*)::int from "replies" r3 where r3.author = ${schema.users.username}) * 5
      )`,
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
    .where(ilike(schema.replies.content, `%${query}%`))
    .limit(5)
    .then((rows) => rows.map(mapReplyItem)),
    searchUsers(db, query),
  ]);

  return c.json({ chambers, questions: posts, replies, users });
});
