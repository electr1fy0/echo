import { desc, eq, inArray, and, or, notInArray, sql } from "drizzle-orm";

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
    actorIsAnonymous?: boolean;
  },
) => {
  await db
    .insert(schema.notifications)
    .values({
      userUsername: payload.userUsername,
      actorUsername: payload.actorUsername ?? null,
      type: payload.type,
      referenceUid: payload.referenceUid,
      actorIsAnonymous: payload.actorIsAnonymous ?? false,
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
  isAnonymous?: boolean,
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
          actorIsAnonymous: isAnonymous,
        }),
      ),
  );
};

export const countUnreadNotifications = async (db: DB, currentUser: string): Promise<number> => {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.notifications)
    .where(and(eq(schema.notifications.userUsername, currentUser), eq(schema.notifications.isRead, false)));
  return Number(result?.count ?? 0);
};

export const markNotificationsAsRead = async (db: DB, currentUser: string) => {
  await db
    .update(schema.notifications)
    .set({ isRead: true })
    .where(and(eq(schema.notifications.userUsername, currentUser), eq(schema.notifications.isRead, false)));
};

export const cleanupOrphanedNotifications = async (db: DB, currentUser: string) => {
  const userNotifications = db
    .select({ uid: schema.notifications.uid, referenceUid: schema.notifications.referenceUid, type: schema.notifications.type })
    .from(schema.notifications)
    .where(eq(schema.notifications.userUsername, currentUser))
    .as("user_notifications");

  // Delete post-type notifications where the post no longer exists
  await db
    .delete(schema.notifications)
    .where(
      and(
        eq(schema.notifications.userUsername, currentUser),
        inArray(schema.notifications.type, ["upvote_post", "mention_post", "express_interest", "milestone"]),
        notInArray(
          schema.notifications.referenceUid,
          db.select({ uid: schema.posts.uid }).from(schema.posts),
        ),
      ),
    );

  // Delete reply-type notifications where the reply no longer exists
  await db
    .delete(schema.notifications)
    .where(
      and(
        eq(schema.notifications.userUsername, currentUser),
        inArray(schema.notifications.type, ["upvote_reply", "reply_post", "mention_reply"]),
        notInArray(
          schema.notifications.referenceUid,
          db.select({ uid: schema.replies.uid }).from(schema.replies),
        ),
      ),
    );
};

export const listNotifications = async (db: DB, currentUser: string, limit: number, offset: number) => {
  await cleanupOrphanedNotifications(db, currentUser);
  const rows = await db
    .select({
      uid: schema.notifications.uid,
      userUsername: schema.notifications.userUsername,
      actorUsername: schema.notifications.actorUsername,
      actorAvatar: schema.users.avatar,
      actorIsAnonymous: schema.notifications.actorIsAnonymous,
      type: schema.notifications.type,
      referenceUid: schema.notifications.referenceUid,
      content: sql<string>`''`,
      questionContent: sql<string>`''`,
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
      let postUid: string | null = null;

      if (row.type === "upvote_post" || row.type === "mention_post" || row.type === "express_interest" || row.type === "milestone") {
        postUid = row.referenceUid;
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
          postUid = reply.postUid;
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
        actor_is_anonymous: row.actorIsAnonymous ?? false,
        type: row.type,
        reference_uid: row.referenceUid,
        post_uid: postUid ?? "",
        content,
        question_content: questionContent,
        is_read: row.isRead ?? false,
        created_at: row.createdAt?.toISOString() ?? null,
      };
    }),
  );
};
