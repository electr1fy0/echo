import { eq, and, isNull, inArray, sql } from "drizzle-orm";
import type { DB } from "../db";
import { schema } from "../db";

export type UserRow = typeof schema.users.$inferSelect;
export type NewUser = typeof schema.users.$inferInsert;

export const findByUsername = (db: DB, username: string) =>
  db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1).then((r) => r[0] ?? null);

export const findByEmail = (db: DB, email: string) =>
  db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1).then((r) => r[0] ?? null);

export const findByVerificationToken = (db: DB, token: string) =>
  db.select().from(schema.users).where(eq(schema.users.verificationToken, token)).limit(1).then((r) => r[0] ?? null);

export const findByResetToken = (db: DB, token: string) =>
  db.select().from(schema.users).where(eq(schema.users.resetToken, token)).limit(1).then((r) => r[0] ?? null);

export const findActiveByUsername = (db: DB, username: string) =>
  db
    .select()
    .from(schema.users)
    .where(and(eq(schema.users.username, username), isNull(schema.users.deletedAt)))
    .limit(1)
    .then((r) => r[0] ?? null);

export const searchByQuery = (db: DB, query: string) =>
  db
    .select({
      username: schema.users.username,
      avatar: sql<string>`coalesce(${schema.users.avatar}, '')`,
      bio: sql<string>`coalesce(${schema.users.bio}, '')`,
    })
    .from(schema.users)
    .where(
      and(
        sql`${schema.users.searchVector} @@ plainto_tsquery('english', ${query})`,
        isNull(schema.users.deletedAt),
      ),
    )
    .limit(5);

export const resolveUsernames = async (db: DB, usernames: string[]) => {
  const rows = await db
    .select({ username: schema.users.username })
    .from(schema.users)
    .where(and(inArray(schema.users.username, usernames), isNull(schema.users.deletedAt)));
  return new Set(rows.map((r) => r.username));
};

export const createUser = (db: DB, data: NewUser) =>
  db.insert(schema.users).values(data).returning();

export const updateUser = (db: DB, username: string, data: Partial<NewUser>) =>
  db.update(schema.users).set(data).where(eq(schema.users.username, username));

export const softDeleteUser = (db: DB, username: string) =>
  db
    .update(schema.users)
    .set({
      deletedAt: new Date(),
      password: null,
      email: `deleted-${username}@deleted.local`,
      bio: null,
      avatar: null,
      links: null,
      dmEnabled: false,
    })
    .where(eq(schema.users.username, username));

export const getProfile = (db: DB, username: string, isOwnProfile = false) => {
  const query = db
    .select({
      username: schema.users.username,
      bio: schema.users.bio,
      avatar: schema.users.avatar,
      answered: schema.users.answered,
      posted: schema.users.posted,
      reputation: schema.users.reputation,
      ...(isOwnProfile
        ? {
            email: schema.users.email,
            isVerified: schema.users.isVerified,
            links: schema.users.links,
            tourSeen: schema.users.tourSeen,
            badges: schema.users.badges,
            dmEnabled: schema.users.dmEnabled,
          }
        : {}),
    })
    .from(schema.users)
    .where(and(eq(schema.users.username, username), isNull(schema.users.deletedAt)))
    .limit(1);

  return query.then((r) => r[0] ?? null);
};
