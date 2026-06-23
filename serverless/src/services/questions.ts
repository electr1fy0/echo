import { and, asc, desc, eq, ilike, or, sql, isNotNull, isNull } from "drizzle-orm";

import type { DB } from "../db";
import { schema } from "../db";
import { ApiError } from "../lib/errors";

export const mapPostItem = (row: {
  uid: string;
  content: string | null;
  timeCreated: Date | null;
  authorUsername: string;
  authorAvatar: string;
  upvotes: number | null;
  isUpvoted: boolean;
  chamberUid: string;
  chamberName: string;
  channelUid: string | null;
  customFields: Record<string, any> | null;
  acceptedAnswerUid: string | null;
  pinnedAt: Date | null;
  expiresAt: Date | null;
  postType: string;
  partnerTargetGrade: string | null;
  partnerWorkstyle: string | null;
  partnerSlotsNeeded: number | null;
  partnerStatus: string | null;
  tradePrice: number | null;
  tradeCondition: string | null;
  tradeBookIsbn: string | null;
  tradeStatus: string | null;
  taxiDeparture: string | null;
  taxiDestination: string | null;
  taxiDatetime: string | null;
  taxiSeatsAvailable: number | null;
  taxiStatus: string | null;
  pollUid: string | null;
  pollQuestion: string | null;
  pollOptions: string[] | null;
  pollExpiresAt: Date | null;
  pollIsClosed: boolean | null;
  pollVotes: { optionIndex: number; count: number }[] | null;
  userPollVote: number | null;
}) => ({
  question: {
    uid: row.uid,
    content: row.content ?? "",
    timeCreated: row.timeCreated?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    authorUsername: row.authorUsername,
    upvotes: row.upvotes ?? 0,
    isUpvoted: row.isUpvoted,
    chamberUid: row.chamberUid,
    chamberName: row.chamberName,
    channelUid: row.channelUid,
    customFields: row.customFields ?? {},
    acceptedAnswerUid: row.acceptedAnswerUid ?? undefined,
    isPinned: row.pinnedAt !== null,
    postType: row.postType,
    partnerTargetGrade: row.partnerTargetGrade,
    partnerWorkstyle: row.partnerWorkstyle,
    partnerSlotsNeeded: row.partnerSlotsNeeded,
    partnerStatus: row.partnerStatus,
    tradePrice: row.tradePrice,
    tradeCondition: row.tradeCondition,
    tradeBookIsbn: row.tradeBookIsbn,
    tradeStatus: row.tradeStatus,
    taxiDeparture: row.taxiDeparture,
    taxiDestination: row.taxiDestination,
    taxiDatetime: row.taxiDatetime,
    taxiSeatsAvailable: row.taxiSeatsAvailable,
    taxiStatus: row.taxiStatus,
    pollUid: row.pollUid ?? undefined,
    pollQuestion: row.pollQuestion ?? undefined,
    pollOptions: row.pollOptions ?? undefined,
    pollExpiresAt: row.pollExpiresAt?.toISOString() ?? null,
    pollIsClosed: row.pollIsClosed ?? false,
    pollVotes: row.pollVotes ?? [],
    userPollVote: row.userPollVote ?? null,
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
  postUid: string;
  parentReplyUid: string | null;
  authorUsername: string;
  authorAvatar: string;
  upvotes: number | null;
  isUpvoted: boolean;
  acceptedAnswerUid: string | null;
}) => ({
  answer: {
    uid: row.uid,
    content: row.content,
    questionUid: row.postUid,
    parentReplyUid: row.parentReplyUid ?? undefined,
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

export const ensurePostExists = async (db: DB, uid: string) => {
  const [post] = await db
    .select({ uid: schema.posts.uid, author: schema.posts.author })
    .from(schema.posts)
    .where(eq(schema.posts.uid, uid))
    .limit(1);

  if (!post) {
    throw new ApiError(404, "post not found");
  }

  return post;
};

export const ensureReplyExists = async (db: DB, uid: string) => {
  const [reply] = await db
    .select({ uid: schema.replies.uid, author: schema.replies.author })
    .from(schema.replies)
    .where(eq(schema.replies.uid, uid))
    .limit(1);

  if (!reply) {
    throw new ApiError(404, "reply not found");
  }

  return reply;
};

export const getPostItems = async (
  db: DB,
  currentUser: string | undefined | null,
  params: {
    limit: number;
    offset: number;
    sort?: string;
    filter?: string;
    chamberUid?: string;
    channelUid?: string;
    author?: string;
    query?: string;
    postType?: string;
    pinned?: boolean;
  },
) => {
  const conditions = [];

  if (params.chamberUid) {
    conditions.push(eq(schema.posts.chamberUid, params.chamberUid));
  }

  if (params.channelUid) {
    conditions.push(eq(schema.posts.channelUid, params.channelUid));
  }

  if (params.author) {
    conditions.push(eq(schema.posts.author, params.author));
  }

  if (params.query) {
    conditions.push(ilike(schema.posts.content, `%${params.query}%`));
  }

  if (params.postType) {
    conditions.push(eq(schema.posts.postType, params.postType));
  }

  if (params.pinned === true) {
    conditions.push(isNotNull(schema.posts.pinnedAt));
  } else if (params.pinned === false) {
    conditions.push(isNull(schema.posts.pinnedAt));
  }

  conditions.push(
    or(isNull(schema.posts.expiresAt), sql`${schema.posts.expiresAt} > now()`),
  );

  if (params.filter === "joined") {
    conditions.push(isNotNull(schema.chamberMembers.username));
  }

  const rows = await db
    .select({
      uid: schema.posts.uid,
      content: schema.posts.content,
      timeCreated: schema.posts.timeCreated,
      authorUsername: schema.posts.author,
      authorAvatar: sql<string>`coalesce(${schema.users.avatar}, '')`,
      upvotes: schema.posts.upvotesCount,
      isUpvoted: sql<boolean>`exists (
        select 1 from post_upvotes pv
        where pv.post_uid = ${schema.posts.uid}
          and pv.username = ${currentUser || ""}
      )`,
      chamberUid: schema.posts.chamberUid,
      chamberName: sql<string>`coalesce(${schema.chambers.name}, '')`,
      channelUid: schema.posts.channelUid,
      customFields: schema.posts.customFields,
      acceptedAnswerUid: schema.posts.acceptedAnswerUid,
      pinnedAt: schema.posts.pinnedAt,
      expiresAt: schema.posts.expiresAt,
      joinedByCurrentUser: sql<string | null>`${schema.chamberMembers.username}`,
      postType: schema.posts.postType,
      partnerTargetGrade: schema.posts.partnerTargetGrade,
      partnerWorkstyle: schema.posts.partnerWorkstyle,
      partnerSlotsNeeded: schema.posts.partnerSlotsNeeded,
      partnerStatus: schema.posts.partnerStatus,
      tradePrice: schema.posts.tradePrice,
      tradeCondition: schema.posts.tradeCondition,
      tradeBookIsbn: schema.posts.tradeBookIsbn,
      tradeStatus: schema.posts.tradeStatus,
      taxiDeparture: schema.posts.taxiDeparture,
      taxiDestination: schema.posts.taxiDestination,
      taxiDatetime: schema.posts.taxiDatetime,
      taxiSeatsAvailable: schema.posts.taxiSeatsAvailable,
      taxiStatus: schema.posts.taxiStatus,
      pollUid: schema.polls.uid,
      pollQuestion: schema.polls.question,
      pollOptions: schema.polls.options,
      pollExpiresAt: schema.polls.expiresAt,
      pollIsClosed: schema.polls.isClosed,
      pollVotes: sql<{ optionIndex: number; count: number }[]>`COALESCE(
        (
          SELECT json_agg(json_build_object('optionIndex', pv.option_index, 'count', pv.cnt) ORDER BY pv.option_index)
          FROM (
            SELECT pv2.option_index, COUNT(*)::int as cnt
            FROM poll_votes pv2
            WHERE pv2.poll_uid = ${schema.polls.uid}
            GROUP BY pv2.option_index
          ) pv
        ),
        '[]'::json
      )`,
      userPollVote: sql<number | null>`(
        SELECT pv3.option_index
        FROM poll_votes pv3
        WHERE pv3.poll_uid = ${schema.polls.uid}
          AND pv3.username = ${currentUser || ""}
        LIMIT 1
      )`,
    })
    .from(schema.posts)
    .leftJoin(schema.users, eq(schema.users.username, schema.posts.author))
    .leftJoin(schema.chambers, eq(schema.chambers.uid, schema.posts.chamberUid))
    .leftJoin(
      schema.chamberMembers,
      and(
        eq(schema.chamberMembers.chamberUid, schema.posts.chamberUid),
        eq(schema.chamberMembers.username, currentUser || ""),
      ),
    )
    .leftJoin(schema.polls, eq(schema.polls.postUid, schema.posts.uid))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(
      desc(sql<number>`case when ${schema.posts.pinnedAt} is not null then 1 else 0 end`),
      desc(schema.posts.pinnedAt),
      ...(params.sort === "votes" ? [desc(schema.posts.upvotesCount)] : []),
      desc(schema.posts.timeCreated),
    )
    .limit(params.limit)
    .offset(params.offset);

  return rows.map(({ joinedByCurrentUser: _joinedByCurrentUser, ...row }) =>
    mapPostItem(row),
  );
};

export const getReplies = async (db: DB, currentUser: string | undefined | null, postUid: string) => {
  const rows = await db
    .select({
      uid: schema.replies.uid,
      content: schema.replies.content,
      timeCreated: schema.replies.timeCreated,
      postUid: schema.replies.postUid,
      parentReplyUid: schema.replies.parentReplyUid,
      authorUsername: schema.replies.author,
      authorAvatar: sql<string>`coalesce(${schema.users.avatar}, '')`,
      upvotes: schema.replies.upvotesCount,
      isUpvoted: sql<boolean>`exists (
        select 1 from reply_upvotes rv
        where rv.reply_uid = ${schema.replies.uid}
          and rv.username = ${currentUser || ""}
      )`,
      acceptedAnswerUid: schema.posts.acceptedAnswerUid,
    })
    .from(schema.replies)
    .leftJoin(schema.users, eq(schema.users.username, schema.replies.author))
    .leftJoin(schema.posts, eq(schema.posts.uid, schema.replies.postUid))
    .where(eq(schema.replies.postUid, postUid))
    .orderBy(
      desc(sql<number>`case when ${schema.posts.acceptedAnswerUid} = ${schema.replies.uid} then 1 else 0 end`),
      asc(schema.replies.timeCreated),
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
    )
    .orderBy(
      ...(query
        ? [desc(scoreSql), desc(schema.chambers.createdAt)]
        : [asc(isJoinedSql), desc(scoreSql), desc(schema.chambers.createdAt)]
      )
    );
};

