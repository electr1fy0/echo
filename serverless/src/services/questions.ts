import { and, asc, desc, eq, or, sql, isNotNull, isNull } from "drizzle-orm";

// eslint-disable-next-line no-restricted-imports
import { slugify } from "../lib/utils";

import type { DB } from "../db";
import { schema } from "../db";
import { ApiError } from "../lib/errors";
import { algorithmScore } from "./algorithm";

export const mapPostItem = (row: {
  uid: string;
  slug: string;
  content: string | null;
  timeCreated: Date | null;
  authorUsername: string;
  authorAvatar: string;
  authorReputation: number;
  authorBio: string | null;
  authorPosted: number | null;
  authorAnswered: number | null;
  isAnonymous: boolean;
  upvotes: number | null;
  isUpvoted: boolean;
  chamberUid: string;
  chamberName: string;
  channelUid: string | null;
  channelSchema: any[] | null;
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
  repliesCount: number;
  authorDeletedAt: Date | null;
}) => {
  const isDeletedUser = !!row.authorDeletedAt;
  const displayName = isDeletedUser ? "[deleted]" : row.authorUsername;

  return {
    question: {
      uid: row.uid,
      slug: row.slug,
      content: row.content ?? "",
      timeCreated: row.timeCreated?.toISOString() ?? null,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      authorUsername: displayName,
      isAnonymous: row.isAnonymous || isDeletedUser,
      upvotes: row.upvotes ?? 0,
      isUpvoted: row.isUpvoted,
      chamberUid: row.chamberUid,
      chamberName: row.chamberName,
      channelUid: row.channelUid,
      channelSchema: row.channelSchema ?? [],
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
      repliesCount: row.repliesCount,
    },
    author: isDeletedUser
      ? { username: "[deleted]", avatar: "" }
      : {
          username: row.authorUsername,
          avatar: row.authorAvatar,
          reputation: row.authorReputation,
        },
  };
};

export const mapReplyItem = (row: {
  uid: string;
  content: string;
  timeCreated: Date | null;
  postUid: string;
  parentReplyUid: string | null;
  isAnonymous: boolean;
  authorUsername: string;
  authorAvatar: string;
  authorBio: string | null;
  authorPosted: number | null;
  authorAnswered: number | null;
  authorReputation: number;
  upvotes: number | null;
  isUpvoted: boolean;
  acceptedAnswerUid: string | null;
  authorDeletedAt: Date | null;
}) => {
  const isDeletedReply = row.content === "[deleted]";
  const isDeletedUser = !!row.authorDeletedAt;
  const displayName = (isDeletedReply || isDeletedUser) ? "[deleted]" : row.authorUsername;

  return {
    answer: {
      uid: row.uid,
      content: row.content,
      questionUid: row.postUid,
      parentReplyUid: row.parentReplyUid ?? undefined,
      timeCreated: row.timeCreated?.toISOString() ?? null,
      authorUsername: displayName,
      isAnonymous: row.isAnonymous || isDeletedReply || isDeletedUser,
      upvotes: row.upvotes ?? 0,
      isUpvoted: row.isUpvoted,
      isAccepted: row.acceptedAnswerUid === row.uid,
    },
    author: (isDeletedReply || isDeletedUser)
      ? { username: "[deleted]", avatar: "" }
      : {
          username: row.authorUsername,
          avatar: row.authorAvatar,
          bio: row.authorBio ?? undefined,
          posted: row.authorPosted ?? 0,
          answered: row.authorAnswered ?? 0,
          reputation: row.authorReputation,
        },
  };
};

export const mapChamber = (row: {
  uid: string;
  slug: string;
  name: string;
  description: string;
  creatorUsername: string | null;
  colorIndex: number | null;
  timeCreated: Date | null;
  memberCount: number;
  isJoined: boolean;
  picture: string | null;
  icon: string | null;
}) => ({
  uid: row.uid,
  slug: row.slug,
  name: row.name,
  description: row.description,
  creatorUsername: row.creatorUsername ?? "",
  colorIndex: row.colorIndex ?? 0,
  timeCreated: row.timeCreated?.toISOString() ?? null,
  memberCount: row.memberCount,
  isJoined: row.isJoined,
  picture: row.picture,
  icon: row.icon,
});

export const ensurePostExists = async (db: DB, identifier: string) => {
  const [post] = await db
    .select({ uid: schema.posts.uid, author: schema.posts.author, slug: schema.posts.slug })
    .from(schema.posts)
    .where(or(eq(schema.posts.uid, identifier), eq(schema.posts.slug, identifier)))
    .limit(1);

  if (!post) {
    throw new ApiError(404, "post not found");
  }

  return post;
};

export const resolvePostUid = async (db: DB, identifier: string): Promise<string> => {
  const post = await ensurePostExists(db, identifier);
  return post.uid;
};

export const generatePostSlug = async (db: DB, content: string): Promise<string> => {
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

export const resolveChamber = async (db: DB, identifier: string) => {
  const [chamber] = await db
    .select({
      uid: schema.chambers.uid,
      slug: schema.chambers.slug,
      name: schema.chambers.name,
      creatorUsername: schema.chambers.creatorUsername,
    })
    .from(schema.chambers)
    .where(or(eq(schema.chambers.uid, identifier), eq(schema.chambers.slug, identifier)))
    .limit(1);

  if (!chamber) {
    throw new ApiError(404, "chamber not found");
  }

  return chamber;
};

export const generateChamberSlug = async (db: DB, name: string, excludeUid?: string): Promise<string> => {
  const base = slugify(name);
  const existing = await db
    .select({ slug: schema.chambers.slug, uid: schema.chambers.uid })
    .from(schema.chambers)
    .where(eq(schema.chambers.slug, base))
    .limit(1);
  if (!existing.length || (excludeUid && existing[0].uid === excludeUid)) return base;

  let counter = 1;
  while (true) {
    const slug = `${base}-${counter}`;
    const [row] = await db
      .select({ slug: schema.chambers.slug })
      .from(schema.chambers)
      .where(eq(schema.chambers.slug, slug))
      .limit(1);
    if (!row) return slug;
    counter++;
  }
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
    channelName?: string;
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

  if (params.channelName) {
    conditions.push(eq(schema.channels.name, params.channelName));
  }

  if (params.author) {
    conditions.push(eq(schema.posts.author, params.author));
  }

  if (params.query) {
    conditions.push(sql`${schema.posts.searchVector} @@ plainto_tsquery('english', ${params.query})`);
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

  if (params.filter === "following") {
    conditions.push(
      or(
        isNotNull(schema.chamberMembers.username),
        isNotNull(schema.follows.followerUsername),
      ),
    );
  }

  const rows = await db
    .select({
      uid: schema.posts.uid,
      slug: schema.posts.slug,
      content: schema.posts.content,
      timeCreated: schema.posts.timeCreated,
      authorUsername: schema.posts.author,
      authorAvatar: sql<string>`coalesce(${schema.users.avatar}, '')`,
      authorBio: schema.users.bio,
      authorPosted: schema.users.posted,
      authorAnswered: schema.users.answered,
      authorReputation: sql<number>`coalesce(${schema.users.reputation}, 0)`,
      authorDeletedAt: schema.users.deletedAt,
      isAnonymous: schema.posts.isAnonymous,
      upvotes: schema.posts.upvotesCount,
      isUpvoted: sql<boolean>`exists (
        select 1 from post_upvotes pv
        where pv.post_uid = ${schema.posts.uid}
          and pv.username = ${currentUser || ""}
      )`,
      chamberUid: schema.posts.chamberUid,
      chamberName: sql<string>`coalesce(${schema.chambers.name}, '')`,
      channelUid: schema.posts.channelUid,
      channelSchema: schema.channels.schema,
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
      repliesCount: sql<number>`(
        select count(*)::int from replies r
        where r.post_uid = ${schema.posts.uid}
      )`,
    })
    .from(schema.posts)
    .leftJoin(schema.users, eq(schema.users.username, schema.posts.author))
    .leftJoin(schema.chambers, eq(schema.chambers.uid, schema.posts.chamberUid))
    .leftJoin(schema.channels, eq(schema.channels.uid, schema.posts.channelUid))
    .leftJoin(
      schema.chamberMembers,
      and(
        eq(schema.chamberMembers.chamberUid, schema.posts.chamberUid),
        eq(schema.chamberMembers.username, currentUser || ""),
      ),
    )
    .leftJoin(
      schema.follows,
      and(
        eq(schema.follows.followerUsername, currentUser || ""),
        eq(schema.follows.followingUsername, schema.posts.author),
      ),
    )
    .leftJoin(schema.polls, eq(schema.polls.postUid, schema.posts.uid))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(
      desc(sql<number>`case when ${schema.posts.pinnedAt} is not null then 1 else 0 end`),
      desc(schema.posts.pinnedAt),
      ...(params.sort === "votes" ? [desc(schema.posts.upvotesCount)] : []),
      ...(params.sort === "hot" ? [desc(algorithmScore(currentUser)), desc(schema.posts.timeCreated)] : []),
      ...(params.sort !== "votes" && params.sort !== "hot" ? [desc(schema.posts.timeCreated)] : []),
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
      authorBio: schema.users.bio,
      authorPosted: schema.users.posted,
      authorAnswered: schema.users.answered,
      isAnonymous: schema.replies.isAnonymous,
      authorReputation: sql<number>`coalesce(${schema.users.reputation}, 0)`,
      authorDeletedAt: schema.users.deletedAt,
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
    .where(and(sql`${schema.users.searchVector} @@ plainto_tsquery('english', ${query})`, isNull(schema.users.deletedAt)))
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
    .from(schema.chambers
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

