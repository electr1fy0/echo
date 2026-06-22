import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
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

  return convs.map((c) => {
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
