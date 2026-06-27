import { and, desc, eq, gt, inArray, isNull, ne, or, sql } from "drizzle-orm";
import type { DB } from "../db";
import { schema } from "../db";
import { ApiError } from "../lib/errors";

export const getConversations = async (db: DB, username: string) => {
  const convs = await db
    .select()
    .from(schema.conversations)
    .where(
      or(
        eq(schema.conversations.participantA, username),
        eq(schema.conversations.participantB, username),
      ),
    )
    .orderBy(desc(schema.conversations.lastMessageAt));

  if (!convs.length) return [];

  const otherUsernames = convs.map((c) =>
    c.participantA === username ? c.participantB : c.participantA,
  );

  const userRows = await db
    .select({
      username: schema.users.username,
      avatar: schema.users.avatar,
      bio: schema.users.bio,
      dmEnabled: schema.users.dmEnabled,
      deletedAt: schema.users.deletedAt,
    })
    .from(schema.users)
    .where(inArray(schema.users.username, otherUsernames));

  const userMap = new Map(userRows.map((u) => [u.username, u]));

  // Batch fetch unread counts for all conversations in a single query
  const convUids = convs.map((c) => c.uid);
  const unreadRows = await db
    .select({
      conversationUid: schema.messages.conversationUid,
      count: sql<number>`count(*)`,
    })
    .from(schema.messages)
    .innerJoin(
      schema.conversations,
      eq(schema.messages.conversationUid, schema.conversations.uid),
    )
    .where(
      and(
        inArray(schema.messages.conversationUid, convUids),
        ne(schema.messages.sender, username),
        or(
          and(
            eq(schema.conversations.participantA, username),
            or(
              isNull(schema.conversations.participantALastReadAt),
              gt(schema.messages.timeCreated, schema.conversations.participantALastReadAt),
            ),
          ),
          and(
            eq(schema.conversations.participantB, username),
            or(
              isNull(schema.conversations.participantBLastReadAt),
              gt(schema.messages.timeCreated, schema.conversations.participantBLastReadAt),
            ),
          ),
        ),
      ),
    )
    .groupBy(schema.messages.conversationUid);

  const unreadMap = new Map(unreadRows.map((r) => [r.conversationUid, Number(r.count)]));

  return convs.map((c) => {
    const other = c.participantA === username ? c.participantB : c.participantA;
    const u = userMap.get(other);
    const isDeletedUser = !!u?.deletedAt;
    return {
      uid: c.uid,
      lastMessageAt: c.lastMessageAt ? c.lastMessageAt.toISOString() : null,
      lastMessagePreview: c.lastMessagePreview,
      lastMessageSender: c.lastMessageSender,
      participantA: isDeletedUser ? "[deleted]" : c.participantA,
      participantB: isDeletedUser ? "[deleted]" : c.participantB,
      otherUsername: isDeletedUser ? "[deleted]" : other,
      otherAvatar: isDeletedUser ? "" : (u?.avatar ?? ""),
      otherBio: isDeletedUser ? "" : (u?.bio ?? ""),
      otherDmEnabled: isDeletedUser ? false : (u?.dmEnabled ?? true),
      unreadCount: unreadMap.get(c.uid) ?? 0,
    };
  });
};

export const getOrCreateConversation = async (
  db: DB,
  currentUsername: string,
  otherUsername: string,
) => {
  const [a, b] =
    currentUsername < otherUsername
      ? [currentUsername, otherUsername]
      : [otherUsername, currentUsername];

  const [existing] = await db
    .select()
    .from(schema.conversations)
    .where(
      and(
        eq(schema.conversations.participantA, a),
        eq(schema.conversations.participantB, b),
      ),
    )
    .limit(1);

  if (existing) return existing;

  const [created] = await db
    .insert(schema.conversations)
    .values({ participantA: a, participantB: b })
    .returning();

  return created;
};

export const getMessages = async (
  db: DB,
  conversationUid: string,
  currentUsername: string,
  limit = 50,
  offset = 0,
  since?: string,
) => {
  const [conv] = await db
    .select()
    .from(schema.conversations)
    .where(eq(schema.conversations.uid, conversationUid))
    .limit(1);

  if (!conv) throw new ApiError(404, "conversation not found");
  if (conv.participantA !== currentUsername && conv.participantB !== currentUsername) {
    throw new ApiError(403, "access denied");
  }

  const conditions = [eq(schema.messages.conversationUid, conversationUid)];
  if (since) {
    conditions.push(gt(schema.messages.timeCreated, new Date(since)));
  }

  const rows = await db
    .select({
      uid: schema.messages.uid,
      conversationUid: schema.messages.conversationUid,
      sender: schema.messages.sender,
      content: schema.messages.content,
      timeCreated: schema.messages.timeCreated,
    })
    .from(schema.messages)
    .where(and(...conditions))
    .orderBy(desc(schema.messages.timeCreated))
    .limit(limit)
    .offset(offset);

  return rows.reverse();
};

export const createMessage = async (
  db: DB,
  conversationUid: string,
  sender: string,
  content: string,
) => {
  if (!content.trim()) throw new ApiError(400, "message content cannot be empty");

  const [conv] = await db
    .select()
    .from(schema.conversations)
    .where(eq(schema.conversations.uid, conversationUid))
    .limit(1);

  if (!conv) throw new ApiError(404, "conversation not found");
  if (conv.participantA !== sender && conv.participantB !== sender) {
    throw new ApiError(403, "access denied");
  }

  const [msg] = await db
    .insert(schema.messages)
    .values({ conversationUid, sender, content })
    .returning();

  await db
    .update(schema.conversations)
    .set({
      lastMessageAt: new Date(),
      lastMessagePreview: content.slice(0, 100),
      lastMessageSender: sender,
    })
    .where(eq(schema.conversations.uid, conversationUid));

  return msg;
};

export const markConversationAsRead = async (
  db: DB,
  conversationUid: string,
  currentUser: string,
) => {
  const [conv] = await db
    .select()
    .from(schema.conversations)
    .where(eq(schema.conversations.uid, conversationUid))
    .limit(1);

  if (!conv) return;
  if (conv.participantA !== currentUser && conv.participantB !== currentUser) return;

  if (conv.participantA === currentUser) {
    await db
      .update(schema.conversations)
      .set({ participantALastReadAt: new Date() })
      .where(eq(schema.conversations.uid, conversationUid));
  } else {
    await db
      .update(schema.conversations)
      .set({ participantBLastReadAt: new Date() })
      .where(eq(schema.conversations.uid, conversationUid));
  }
};

export const editMessage = async (
  db: DB,
  conversationUid: string,
  messageUid: string,
  currentUser: string,
  content: string,
) => {
  if (!content.trim()) throw new ApiError(400, "message content cannot be empty");

  const [conv] = await db
    .select()
    .from(schema.conversations)
    .where(eq(schema.conversations.uid, conversationUid))
    .limit(1);

  if (!conv) throw new ApiError(404, "conversation not found");
  if (conv.participantA !== currentUser && conv.participantB !== currentUser) {
    throw new ApiError(403, "access denied");
  }

  const [existing] = await db
    .select()
    .from(schema.messages)
    .where(and(eq(schema.messages.uid, messageUid), eq(schema.messages.conversationUid, conversationUid)))
    .limit(1);

  if (!existing || existing.sender !== currentUser) throw new ApiError(404, "message not found");

  const [updated] = await db
    .update(schema.messages)
    .set({ content })
    .where(eq(schema.messages.uid, messageUid))
    .returning();

  return updated;
};

export const deleteMessage = async (
  db: DB,
  conversationUid: string,
  messageUid: string,
  currentUser: string,
) => {
  const [conv] = await db
    .select()
    .from(schema.conversations)
    .where(eq(schema.conversations.uid, conversationUid))
    .limit(1);

  if (!conv) throw new ApiError(404, "conversation not found");
  if (conv.participantA !== currentUser && conv.participantB !== currentUser) {
    throw new ApiError(403, "access denied");
  }

  const [existing] = await db
    .select()
    .from(schema.messages)
    .where(and(eq(schema.messages.uid, messageUid), eq(schema.messages.conversationUid, conversationUid)))
    .limit(1);

  if (!existing || existing.sender !== currentUser) throw new ApiError(404, "message not found");

  await db
    .delete(schema.messages)
    .where(eq(schema.messages.uid, messageUid));

  // If this was the last message, update the conversation preview
  const [newLast] = await db
    .select()
    .from(schema.messages)
    .where(eq(schema.messages.conversationUid, conversationUid))
    .orderBy(desc(schema.messages.timeCreated))
    .limit(1);

  if (newLast) {
    await db
      .update(schema.conversations)
      .set({
        lastMessageAt: newLast.timeCreated,
        lastMessagePreview: newLast.content.slice(0, 100),
        lastMessageSender: newLast.sender,
      })
      .where(eq(schema.conversations.uid, conversationUid));
  } else {
    await db
      .update(schema.conversations)
      .set({
        lastMessageAt: null,
        lastMessagePreview: null,
        lastMessageSender: null,
      })
      .where(eq(schema.conversations.uid, conversationUid));
  }

  return true;
};

export const getUnreadMessageCount = async (db: DB, currentUser: string): Promise<number> => {
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.messages)
    .innerJoin(
      schema.conversations,
      eq(schema.messages.conversationUid, schema.conversations.uid),
    )
    .where(
      and(
        or(
          eq(schema.conversations.participantA, currentUser),
          eq(schema.conversations.participantB, currentUser),
        ),
        ne(schema.messages.sender, currentUser),
        or(
          and(
            eq(schema.conversations.participantA, currentUser),
            or(
              isNull(schema.conversations.participantALastReadAt),
              gt(schema.messages.timeCreated, schema.conversations.participantALastReadAt),
            ),
          ),
          and(
            eq(schema.conversations.participantB, currentUser),
            or(
              isNull(schema.conversations.participantBLastReadAt),
              gt(schema.messages.timeCreated, schema.conversations.participantBLastReadAt),
            ),
          ),
        ),
      ),
    );

  return Number(result?.count ?? 0);
};
