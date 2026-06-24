import { and, desc, eq, gt, inArray, isNull, ne, or, sql } from "drizzle-orm";
import type { DB } from "../db";
import { schema } from "../db";

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
    })
    .from(schema.users)
    .where(inArray(schema.users.username, otherUsernames));

  const userMap = new Map(userRows.map((u) => [u.username, u]));

  // Batch fetch unread counts for all conversations
  const unreadCounts = await Promise.all(
    convs.map(async (c) => {
      const lastReadCol =
        c.participantA === username
          ? c.participantALastReadAt
          : c.participantBLastReadAt;
      const conditions: any[] = [
        eq(schema.messages.conversationUid, c.uid),
        ne(schema.messages.sender, username),
      ];
      if (lastReadCol) {
        conditions.push(gt(schema.messages.timeCreated, lastReadCol));
      }
      const [result] = await db
        .select({ count: sql<number>`count(*)` })
        .from(schema.messages)
        .where(and(...conditions));
      return Number(result?.count ?? 0);
    }),
  );

  return convs.map((c, i) => {
    const other = c.participantA === username ? c.participantB : c.participantA;
    const u = userMap.get(other);
    return {
      uid: c.uid,
      lastMessageAt: c.lastMessageAt ? c.lastMessageAt.toISOString() : null,
      lastMessagePreview: c.lastMessagePreview,
      lastMessageSender: c.lastMessageSender,
      participantA: c.participantA,
      participantB: c.participantB,
      otherUsername: other,
      otherAvatar: u?.avatar ?? "",
      otherBio: u?.bio ?? "",
      otherDmEnabled: u?.dmEnabled ?? true,
      unreadCount: unreadCounts[i],
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
) => {
  const [conv] = await db
    .select()
    .from(schema.conversations)
    .where(eq(schema.conversations.uid, conversationUid))
    .limit(1);

  if (!conv) return [];
  if (conv.participantA !== currentUsername && conv.participantB !== currentUsername) {
    return [];
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
    .where(eq(schema.messages.conversationUid, conversationUid))
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
  if (!content.trim()) return null;

  const [conv] = await db
    .select()
    .from(schema.conversations)
    .where(eq(schema.conversations.uid, conversationUid))
    .limit(1);

  if (!conv) return null;
  if (conv.participantA !== sender && conv.participantB !== sender) return null;

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
  if (!content.trim()) return null;

  const [conv] = await db
    .select()
    .from(schema.conversations)
    .where(eq(schema.conversations.uid, conversationUid))
    .limit(1);

  if (!conv) return null;
  if (conv.participantA !== currentUser && conv.participantB !== currentUser) return null;

  const [existing] = await db
    .select()
    .from(schema.messages)
    .where(and(eq(schema.messages.uid, messageUid), eq(schema.messages.conversationUid, conversationUid)))
    .limit(1);

  if (!existing || existing.sender !== currentUser) return null;

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

  if (!conv) return false;
  if (conv.participantA !== currentUser && conv.participantB !== currentUser) return false;

  const [existing] = await db
    .select()
    .from(schema.messages)
    .where(and(eq(schema.messages.uid, messageUid), eq(schema.messages.conversationUid, conversationUid)))
    .limit(1);

  if (!existing || existing.sender !== currentUser) return false;

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
