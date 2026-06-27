import { eq, and, or, sql, desc, asc } from "drizzle-orm";
import type { DB } from "../db";
import { schema } from "../db";
import { ApiError } from "../lib/errors";

export type ChamberRow = typeof schema.chambers.$inferSelect;
export type NewChamber = typeof schema.chambers.$inferInsert;

export const findByUid = (db: DB, uid: string) =>
  db.select().from(schema.chambers).where(eq(schema.chambers.uid, uid)).limit(1).then((r) => r[0] ?? null);

export const findByIdentifier = (db: DB, identifier: string) =>
  db
    .select()
    .from(schema.chambers)
    .where(or(sql`${schema.chambers.uid}::text = ${identifier}`, eq(schema.chambers.slug, identifier)))
    .limit(1)
    .then((r) => r[0] ?? null);

export const ensureExists = async (db: DB, identifier: string) => {
  const chamber = await findByIdentifier(db, identifier);
  if (!chamber) throw new ApiError(404, "chamber not found");
  return chamber;
};

export const isMember = async (db: DB, chamberUid: string, username: string) => {
  const [row] = await db
    .select({ username: schema.chamberMembers.username })
    .from(schema.chamberMembers)
    .where(and(eq(schema.chamberMembers.chamberUid, chamberUid), eq(schema.chamberMembers.username, username)))
    .limit(1);
  return !!row;
};

export const addMember = (db: DB, chamberUid: string, username: string) =>
  db.insert(schema.chamberMembers).values({ chamberUid, username }).onConflictDoNothing();

export const removeMember = (db: DB, chamberUid: string, username: string) =>
  db
    .delete(schema.chamberMembers)
    .where(and(eq(schema.chamberMembers.chamberUid, chamberUid), eq(schema.chamberMembers.username, username)));

export const listChambers = (db: DB, currentUser: string | undefined | null, query = "") => {
  const isJoinedSql = sql<number>`case when exists(
    select 1 from chamber_members cm
    where cm.chamber_uid = ${schema.chambers.uid}
      and cm.username = ${currentUser || ""}
  ) then 1 else 0 end`;

  const scoreSql = sql<number>`(
    (select count(*)::int from chamber_members cm where cm.chamber_uid = ${schema.chambers.uid}) * 5 +
    (select count(*)::int from posts p where p.chamber_uid = ${schema.chambers.uid} and p.time_created > now() - interval '30 days') * 10 +
    (select count(*)::int from posts p where p.chamber_uid = ${schema.chambers.uid})
  )`;

  return db
    .select({
      uid: schema.chambers.uid,
      slug: schema.chambers.slug,
      name: schema.chambers.name,
      description: sql<string>`coalesce(${schema.chambers.description}, '')`,
      creatorUsername: schema.chambers.creatorUsername,
      colorIndex: schema.chambers.colorIndex,
      timeCreated: schema.chambers.createdAt,
      picture: schema.chambers.picture,
      icon: schema.chambers.icon,
      memberCount: sql<number>`(
        select count(*)::int from chamber_members cm
        where cm.chamber_uid = ${schema.chambers.uid}
      )`,
      isJoined: sql<boolean>`exists(
        select 1 from chamber_members cm
        where cm.chamber_uid = ${schema.chambers.uid}
          and cm.username = ${currentUser || ""}
      )`,
    })
    .from(schema.chambers)
    .where(
      query
        ? sql`${schema.chambers.searchVector} @@ plainto_tsquery('english', ${query})`
        : undefined,
    )
    .orderBy(
      ...(query
        ? [desc(scoreSql), desc(schema.chambers.createdAt)]
        : [asc(isJoinedSql), desc(scoreSql), desc(schema.chambers.createdAt)]
      )
    );
};
