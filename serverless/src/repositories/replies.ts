import { eq, and } from "drizzle-orm";
import type { DB } from "../db";
import { schema } from "../db";
import { ApiError } from "../lib/errors";

export type ReplyRow = typeof schema.replies.$inferSelect;
export type NewReply = typeof schema.replies.$inferInsert;

export const findByUid = (db: DB, uid: string) =>
  db.select().from(schema.replies).where(eq(schema.replies.uid, uid)).limit(1).then((r) => r[0] ?? null);

export const ensureExists = async (db: DB, uid: string) => {
  const reply = await findByUid(db, uid);
  if (!reply) throw new ApiError(404, "reply not found");
  return reply;
};

export const createReply = (db: DB, data: NewReply) =>
  db.insert(schema.replies).values(data).returning({ uid: schema.replies.uid, timeCreated: schema.replies.timeCreated });

export const updateReply = (db: DB, uid: string, content: string, author: string) =>
  db
    .update(schema.replies)
    .set({ content })
    .where(and(eq(schema.replies.uid, uid), eq(schema.replies.author, author)));

export const softDeleteReply = (db: DB, uid: string, postUid: string, author: string) =>
  db
    .update(schema.replies)
    .set({ content: "[deleted]", isAnonymous: true })
    .where(and(eq(schema.replies.uid, uid), eq(schema.replies.postUid, postUid), eq(schema.replies.author, author)));

export const getByPostUid = (db: DB, postUid: string) =>
  db.select().from(schema.replies).where(eq(schema.replies.postUid, postUid));

export const findUpvote = (db: DB, username: string, replyUid: string) =>
  db
    .select()
    .from(schema.replyUpvotes)
    .where(and(eq(schema.replyUpvotes.username, username), eq(schema.replyUpvotes.replyUid, replyUid)))
    .limit(1)
    .then((r) => r[0] ?? null);

export const addUpvote = (db: DB, username: string, replyUid: string) =>
  db.insert(schema.replyUpvotes).values({ username, replyUid });

export const removeUpvote = (db: DB, username: string, replyUid: string) =>
  db
    .delete(schema.replyUpvotes)
    .where(and(eq(schema.replyUpvotes.username, username), eq(schema.replyUpvotes.replyUid, replyUid)));

export const incrementUpvoteCount = (db: DB, uid: string) =>
  db
    .update(schema.replies)
    .set({ upvotesCount: sql`${schema.replies.upvotesCount} + 1` })
    .where(eq(schema.replies.uid, uid));

export const decrementUpvoteCount = (db: DB, uid: string) =>
  db
    .update(schema.replies)
    .set({ upvotesCount: sql`greatest(${schema.replies.upvotesCount} - 1, 0)` })
    .where(eq(schema.replies.uid, uid));

import { sql } from "drizzle-orm";
