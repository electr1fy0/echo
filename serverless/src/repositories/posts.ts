import { eq, and, or, sql, inArray, desc } from "drizzle-orm";
import type { DB } from "../db";
import { schema } from "../db";
import { ApiError } from "../lib/errors";

export type PostRow = typeof schema.posts.$inferSelect;
export type NewPost = typeof schema.posts.$inferInsert;

export const findByUid = (db: DB, uid: string) =>
  db.select().from(schema.posts).where(eq(schema.posts.uid, uid)).limit(1).then((r) => r[0] ?? null);

export const findByIdentifier = (db: DB, identifier: string) =>
  db
    .select()
    .from(schema.posts)
    .where(or(sql`${schema.posts.uid}::text = ${identifier}`, eq(schema.posts.slug, identifier)))
    .limit(1)
    .then((r) => r[0] ?? null);

export const ensureExists = async (db: DB, identifier: string) => {
  const post = await findByIdentifier(db, identifier);
  if (!post) throw new ApiError(404, "post not found");
  return post;
};

export const resolveUid = async (db: DB, identifier: string) => {
  const post = await ensureExists(db, identifier);
  return post.uid;
};

export const generateSlug = async (db: DB, content: string): Promise<string> => {
  const { slugify } = await import("../lib/utils");
  const base = slugify(content);
  const existing = await db
    .select({ slug: schema.posts.slug })
    .from(schema.posts)
    .where(eq(schema.posts.slug, base))
    .limit(1);
  if (!existing.length) return base;

  let counter = 1;
  while (true) {
    const slug = `${base}-${counter}`;
    const [row] = await db
      .select({ slug: schema.posts.slug })
      .from(schema.posts)
      .where(eq(schema.posts.slug, slug))
      .limit(1);
    if (!row) return slug;
    counter++;
  }
};

export const createPost = (db: DB, data: NewPost) =>
  db.insert(schema.posts).values(data).returning({ uid: schema.posts.uid });

export const updatePost = (db: DB, uid: string, data: Partial<NewPost>) =>
  db.update(schema.posts).set(data).where(eq(schema.posts.uid, uid));

export const deletePostCascade = async (db: DB, uid: string) => {
  await db
    .delete(schema.notifications)
    .where(
      or(
        eq(schema.notifications.referenceUid, uid),
        inArray(
          schema.notifications.referenceUid,
          db.select({ uid: schema.replies.uid }).from(schema.replies).where(eq(schema.replies.postUid, uid)),
        ),
      ),
    );
  await db.delete(schema.posts).where(eq(schema.posts.uid, uid));
};

export const pinPost = (db: DB, uid: string) =>
  db.update(schema.posts).set({ pinnedAt: new Date() }).where(eq(schema.posts.uid, uid));

export const unpinPost = (db: DB, uid: string) =>
  db.update(schema.posts).set({ pinnedAt: null }).where(eq(schema.posts.uid, uid));

export const acceptReply = (db: DB, postUid: string, replyUid: string) =>
  db
    .update(schema.posts)
    .set({ acceptedAnswerUid: replyUid })
    .where(
      and(
        eq(schema.posts.uid, postUid),
        sql`exists (select 1 from ${schema.replies} r where r.uid = ${replyUid} and r.post_uid = ${schema.posts.uid})`,
      ),
    );

export const unacceptReply = (db: DB, postUid: string, replyUid: string) =>
  db
    .update(schema.posts)
    .set({ acceptedAnswerUid: null })
    .where(and(eq(schema.posts.uid, postUid), eq(schema.posts.acceptedAnswerUid, replyUid)));

export const getUpvoteCount = async (db: DB, postUid: string) => {
  const [r] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.postUpvotes)
    .where(eq(schema.postUpvotes.postUid, postUid));
  return Number(r?.count ?? 0);
};


