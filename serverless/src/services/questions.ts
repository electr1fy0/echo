import { and, asc, desc, eq, ilike, inArray, or, sql, isNotNull } from "drizzle-orm";

import type { DB } from "../db";
import { schema } from "../db";
import { ApiError } from "../lib/errors";

export const mapQuestionItem = (row: {
  uid: string;
  content: string | null;
  timeCreated: Date | null;
  authorUsername: string;
  authorAvatar: string;
  upvotes: number | null;
  isUpvoted: boolean;
  chamberUid: string;
  chamberName: string;
  acceptedAnswerUid: string | null;
  pinnedAt: Date | null;
}) => ({
  question: {
    uid: row.uid,
    content: row.content ?? "",
    timeCreated: row.timeCreated?.toISOString() ?? null,
    authorUsername: row.authorUsername,
    upvotes: row.upvotes ?? 0,
    isUpvoted: row.isUpvoted,
    chamberUid: row.chamberUid,
    chamberName: row.chamberName,
    acceptedAnswerUid: row.acceptedAnswerUid ?? undefined,
    isPinned: row.pinnedAt !== null,
  },
  author: {
    username: row.authorUsername,
    avatar: row.authorAvatar,
  },
});

export const mapReplyItem = (row: {
  uid: string;
  content: string;
  timeCreated: Date | null;
  questionUid: string;
  authorUsername: string;
  authorAvatar: string;
  upvotes: number | null;
  isUpvoted: boolean;
  acceptedAnswerUid: string | null;
}) => ({
  answer: {
    uid: row.uid,
    content: row.content,
    questionUid: row.questionUid,
    timeCreated: row.timeCreated?.toISOString() ?? null,
    authorUsername: row.authorUsername,
    upvotes: row.upvotes ?? 0,
    isUpvoted: row.isUpvoted,
    isAccepted: row.acceptedAnswerUid === row.uid,
  },
  author: {
    username: row.authorUsername,
    avatar: row.authorAvatar,
  },
});

export const mapChamber = (row: {
  uid: string;
  name: string;
  description: string;
  creatorUsername: string | null;
  colorIndex: number | null;
  timeCreated: Date | null;
  memberCount: number;
  isJoined: boolean;
}) => ({
  uid: row.uid,
  name: row.name,
  description: row.description,
  creatorUsername: row.creatorUsername ?? "",
  colorIndex: row.colorIndex ?? 0,
  timeCreated: row.timeCreated?.toISOString() ?? null,
  memberCount: row.memberCount,
  isJoined: row.isJoined,
});

export const ensureQuestionExists = async (db: DB, uid: string) => {
  const [question] = await db
    .select({ uid: schema.questions.uid, author: schema.questions.author })
    .from(schema.questions)
    .where(eq(schema.questions.uid, uid))
    .limit(1);

  if (!question) {
    throw new ApiError(404, "question not found");
  }

  return question;
};

export const ensureReplyExists = async (db: DB, uid: string) => {
  const [reply] = await db
    .select({ uid: schema.answers.uid, author: schema.answers.author })
    .from(schema.answers)
    .where(eq(schema.answers.uid, uid))
    .limit(1);

  if (!reply) {
    throw new ApiError(404, "reply not found");
  }

  return reply;
};

export const getQuestionItems = async (
  db: DB,
  currentUser: string | undefined | null,
  params: {
    limit: number;
    offset: number;
    sort?: string;
    filter?: string;
    chamberUid?: string;
    author?: string;
    query?: string;
  },
) => {
  const conditions = [];

  if (params.chamberUid) {
    conditions.push(eq(schema.questions.chamberUid, params.chamberUid));
  }

  if (params.author) {
    conditions.push(eq(schema.questions.author, params.author));
  }

  if (params.query) {
    conditions.push(ilike(schema.questions.content, `%${params.query}%`));
  }

  if (params.filter === "joined") {
    conditions.push(isNotNull(schema.chamberMembers.username));
  }

  const rows = await db
    .select({
      uid: schema.questions.uid,
      content: schema.questions.content,
      timeCreated: schema.questions.timeCreated,
      authorUsername: schema.questions.author,
      authorAvatar: sql<string>`coalesce(${schema.users.avatar}, '')`,
      upvotes: schema.questions.upvotesCount,
      isUpvoted: sql<boolean>`exists (
        select 1 from question_upvotes qv
        where qv.question_uid = ${schema.questions.uid}
          and qv.username = ${currentUser || ""}
      )`,
      chamberUid: schema.questions.chamberUid,
      chamberName: sql<string>`coalesce(${schema.chambers.name}, '')`,
      acceptedAnswerUid: schema.questions.acceptedAnswerUid,
      pinnedAt: schema.questions.pinnedAt,
      joinedByCurrentUser: sql<string | null>`${schema.chamberMembers.username}`,
    })
    .from(schema.questions)
    .leftJoin(schema.users, eq(schema.users.username, schema.questions.author))
    .leftJoin(schema.chambers, eq(schema.chambers.uid, schema.questions.chamberUid))
    .leftJoin(
      schema.chamberMembers,
      and(
        eq(schema.chamberMembers.chamberUid, schema.questions.chamberUid),
        eq(schema.chamberMembers.username, currentUser || ""),
      ),
    )
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(
      desc(sql<number>`case when ${schema.questions.pinnedAt} is not null then 1 else 0 end`),
      desc(schema.questions.pinnedAt),
      ...(params.sort === "votes" ? [desc(schema.questions.upvotesCount)] : []),
      desc(schema.questions.timeCreated),
    )
    .limit(params.limit)
    .offset(params.offset);

  return rows.map(({ joinedByCurrentUser: _joinedByCurrentUser, ...row }) =>
    mapQuestionItem(row),
  );
};

export const getReplies = async (db: DB, currentUser: string | undefined | null, questionUid: string) => {
  const rows = await db
    .select({
      uid: schema.answers.uid,
      content: schema.answers.content,
      timeCreated: schema.answers.timeCreated,
      questionUid: schema.answers.questionUid,
      authorUsername: schema.answers.author,
      authorAvatar: sql<string>`coalesce(${schema.users.avatar}, '')`,
      upvotes: schema.answers.upvotesCount,
      isUpvoted: sql<boolean>`exists (
        select 1 from answer_upvotes av
        where av.answer_uid = ${schema.answers.uid}
          and av.username = ${currentUser || ""}
      )`,
      acceptedAnswerUid: schema.questions.acceptedAnswerUid,
    })
    .from(schema.answers)
    .leftJoin(schema.users, eq(schema.users.username, schema.answers.author))
    .leftJoin(schema.questions, eq(schema.questions.uid, schema.answers.questionUid))
    .where(eq(schema.answers.questionUid, questionUid))
    .orderBy(
      desc(sql<number>`case when ${schema.questions.acceptedAnswerUid} = ${schema.answers.uid} then 1 else 0 end`),
      asc(schema.answers.timeCreated),
    )
    .limit(200)
    .offset(0);

  return rows.map(mapReplyItem);
};

export const searchUsers = (db: DB, query: string) =>
  db
    .select({
      username: schema.users.username,
      avatar: sql<string>`coalesce(${schema.users.avatar}, '')`,
      bio: sql<string>`coalesce(${schema.users.bio}, '')`,
    })
    .from(schema.users)
    .where(ilike(schema.users.username, `%${query}%`))
    .limit(5);

export const listChambers = (db: DB, currentUser: string | undefined | null, query = "") =>
  db
    .select({
      uid: schema.chambers.uid,
      name: schema.chambers.name,
      description: sql<string>`coalesce(${schema.chambers.description}, '')`,
      creatorUsername: schema.chambers.creatorUsername,
      colorIndex: schema.chambers.colorIndex,
      timeCreated: schema.chambers.createdAt,
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
        ? or(
            ilike(schema.chambers.name, `%${query}%`),
            ilike(schema.chambers.description, `%${query}%`),
          )
        : undefined,
    );
