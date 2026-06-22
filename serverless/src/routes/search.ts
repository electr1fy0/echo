import { Hono } from "hono";
import { eq, ilike, sql } from "drizzle-orm";

import { schema } from "../db";
import { requireAuth, optionalAuth } from "../middleware/auth";
import { getQuestionItems, getReplies, listChambers, mapChamber, mapReplyItem } from "../services/questions";
import { searchUsers } from "../services/questions";
import type { AppEnv } from "../types/app";

export const searchRoutes = new Hono<AppEnv>();

searchRoutes.use("*", optionalAuth);


searchRoutes.get("/", async (c) => {
  const query = c.req.query("q") ?? "";
  if (!query) {
    return c.json({ chambers: [], questions: [], replies: [], users: [] });
  }

  const db = c.get("db");
  const currentUser = c.get("user");

  const [chambers, questions, replies, users] = await Promise.all([
    listChambers(db, currentUser, query).then((rows) => rows.slice(0, 5).map(mapChamber)),
    getQuestionItems(db, currentUser, { limit: 5, offset: 0, query }),
    db.select({
      uid: schema.answers.uid,
      content: schema.answers.content,
      timeCreated: schema.answers.timeCreated,
      questionUid: schema.answers.questionUid,
      authorUsername: schema.answers.author,
      authorAvatar: sql<string>`coalesce(${schema.users.avatar}, '')`,
      upvotes: schema.answers.upvotesCount,
      isUpvoted: sql<boolean>`exists (
        select 1 from answer_upvotes av
        where av.answer_uid = ${schema.answers.uid}
          and av.username = ${currentUser}
      )`,
      acceptedAnswerUid: sql<string | null>`null`,
    }).from(schema.answers).leftJoin(schema.users, eq(schema.users.username, schema.answers.author)).where(ilike(schema.answers.content, `%${query}%`)).limit(5).then((rows) => rows.map(mapReplyItem)),
    searchUsers(db, query),
  ]);

  return c.json({ chambers, questions, replies, users });
});
