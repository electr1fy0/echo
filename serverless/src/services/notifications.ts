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
  const rows = await db
    .select({
      uid: schema.notifications.uid,
      userUsername: schema.notifications.userUsername,
      actorUsername: schema.notifications.actorUsername,
      actorAvatar: schema.users.avatar,
      actorIsAnonymous: schema.notifications.actorIsAnonymous,
      actorDeletedAt: schema.users.deletedAt,
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

  if (!rows.length) return [];

  // Batch fetch all referenced posts and replies in two queries
  const postRefUids = new Set<string>();
  const replyRefUids = new Set<string>();

  for (const row of rows) {
    if (row.type === "upvote_post" || row.type === "mention_post" || row.type === "express_interest" || row.type === "milestone") {
      postRefUids.add(row.referenceUid);
    } else {
      replyRefUids.add(row.referenceUid);
    }
  }

  const [posts, replies] = await Promise.all([
    postRefUids.size
      ? db
          .select({ uid: schema.posts.uid, slug: schema.posts.slug, content: schema.posts.content })
          .from(schema.posts)
          .where(inArray(schema.posts.uid, [...postRefUids]))
      : Promise.resolve([] as { uid: string; slug: string; content: string | null }[]),
    replyRefUids.size
      ? db
          .select({ uid: schema.replies.uid, content: schema.replies.content, postUid: schema.replies.postUid })
          .from(schema.replies)
          .where(inArray(schema.replies.uid, [...replyRefUids]))
      : Promise.resolve([] as { uid: string; content: string | null; postUid: string | null }[]),
  ]);

  const postMap = new Map(posts.map((p) => [p.uid, p.content ?? ""]));
  const postSlugMap = new Map(posts.map((p) => [p.uid, p.slug]));
  const replyMap = new Map(replies.map((r) => [r.uid, r]));
  const replyPostUids = new Set(replies.filter((r) => r.postUid).map((r) => r.postUid!));

  // Batch fetch parent post content for replies
  const parentPosts = replyPostUids.size
    ? await db
        .select({ uid: schema.posts.uid, slug: schema.posts.slug, content: schema.posts.content })
        .from(schema.posts)
        .where(inArray(schema.posts.uid, [...replyPostUids]))
    : [];
  const parentPostMap = new Map(parentPosts.map((p) => [p.uid, p.content ?? ""]));
  const parentPostSlugMap = new Map(parentPosts.map((p) => [p.uid, p.slug]));

  return rows.map((row) => {
    let content = "";
    let questionContent = "";
    let postUid: string | null = null;
    let postSlug: string | null = null;

    if (row.type === "upvote_post" || row.type === "mention_post" || row.type === "express_interest" || row.type === "milestone") {
      postUid = row.referenceUid;
      postSlug = postSlugMap.get(row.referenceUid) ?? null;
      content = postMap.get(row.referenceUid) ?? "";
    } else {
      const reply = replyMap.get(row.referenceUid);
      content = reply?.content ?? "";
      if (reply?.postUid) {
        postUid = reply.postUid;
        postSlug = parentPostSlugMap.get(reply.postUid) ?? null;
        questionContent = parentPostMap.get(reply.postUid) ?? "";
      }
    }

    const isActorDeleted = !!row.actorDeletedAt;

    return {
      uid: row.uid,
      user_username: row.userUsername,
      actor_username: isActorDeleted ? "[deleted]" : (row.actorUsername ?? ""),
      actor_avatar: isActorDeleted ? "" : (row.actorAvatar ?? ""),
      actor_is_anonymous: isActorDeleted ? true : (row.actorIsAnonymous ?? false),
      type: row.type,
      reference_uid: row.referenceUid,
      post_uid: postUid ?? "",
      post_slug: postSlug ?? "",
      content,
      question_content: questionContent,
      is_read: row.isRead ?? false,
      created_at: row.createdAt?.toISOString() ?? null,
    };
  });
};
