import { desc, eq, inArray } from "drizzle-orm";

import type { DB } from "../db";
import { schema } from "../db";
import { extractMentions } from "../lib/utils";

export const createNotification = async (
  db: DB,
  payload: {
    userUsername: string;
    actorUsername?: string | null;
    type: string;
    referenceUid: string;
  },
) => {
  await db
    .insert(schema.notifications)
    .values({
      userUsername: payload.userUsername,
      actorUsername: payload.actorUsername ?? null,
      type: payload.type,
      referenceUid: payload.referenceUid,
    })
    .onConflictDoNothing();
};

export const notifyMentions = async (
  db: DB,
  content: string,
  actor: string,
  referenceUid: string,
  isReply: boolean,
  skipUser?: string,
) => {
  const mentions = extractMentions(content);
  if (!mentions.length) {
    return;
  }

  const existingUsers = await db
    .select({ username: schema.users.username })
    .from(schema.users)
    .where(inArray(schema.users.username, mentions));

  const notificationType = isReply ? "mention_reply" : "mention_post";

  await Promise.all(
    existingUsers
      .map((user) => user.username)
      .filter((username) => username !== actor && username !== skipUser)
      .map((username) =>
        createNotification(db, {
          userUsername: username,
          actorUsername: actor,
          type: notificationType,
          referenceUid,
        }),
      ),
  );
};

export const listNotifications = async (db: DB, currentUser: string, limit: number, offset: number) => {
  const rows = await db
    .select({
      uid: schema.notifications.uid,
      userUsername: schema.notifications.userUsername,
      actorUsername: schema.notifications.actorUsername,
      actorAvatar: schema.users.avatar,
      type: schema.notifications.type,
      referenceUid: schema.notifications.referenceUid,
      content: schema.notifications.referenceUid,
      questionContent: schema.notifications.referenceUid,
      isRead: schema.notifications.isRead,
      createdAt: schema.notifications.createdAt,
    })
    .from(schema.notifications)
    .leftJoin(schema.users, eq(schema.users.username, schema.notifications.actorUsername))
    .where(eq(schema.notifications.userUsername, currentUser))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(limit)
    .offset(offset);

  return Promise.all(
    rows.map(async (row) => {
      let content = "";
      let questionContent = "";

      if (row.type === "upvote_question" || row.type === "mention_question" || row.type === "upvote_post" || row.type === "mention_post" || row.type === "express_interest") {
        const [post] = await db
          .select({ content: schema.posts.content })
          .from(schema.posts)
          .where(eq(schema.posts.uid, row.referenceUid))
          .limit(1);
        content = post?.content ?? "";
      } else {
        const [reply] = await db
          .select({ content: schema.replies.content, postUid: schema.replies.postUid })
          .from(schema.replies)
          .where(eq(schema.replies.uid, row.referenceUid))
          .limit(1);
        content = reply?.content ?? "";

        if (reply?.postUid) {
          const [post] = await db
            .select({ content: schema.posts.content })
            .from(schema.posts)
            .where(eq(schema.posts.uid, reply.postUid))
            .limit(1);
          questionContent = post?.content ?? "";
        }
      }

      return {
        uid: row.uid,
        user_username: row.userUsername,
        actor_username: row.actorUsername ?? "",
        actor_avatar: row.actorAvatar ?? "",
        type: row.type,
        reference_uid: row.referenceUid,
        content,
        question_content: questionContent,
        is_read: row.isRead ?? false,
        created_at: row.createdAt?.toISOString() ?? null,
      };
    }),
  );
};
