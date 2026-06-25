import { eq, sql, and, desc, isNull } from "drizzle-orm";

import type { DB } from "../db";
import { schema } from "../db";
import { ApiError } from "../lib/errors";

const reputationSql = sql<number>`(
  coalesce((select sum(${schema.posts.upvotesCount}) from ${schema.posts} where ${schema.posts.author} = ${schema.users.username}), 0) * 10
  + coalesce((select sum(${schema.replies.upvotesCount}) from ${schema.replies} where ${schema.replies.author} = ${schema.users.username}), 0) * 15
  + (select count(*)::int from ${schema.posts} where ${schema.posts.author} = ${schema.users.username}) * 5
  + (select count(*)::int from ${schema.replies} where ${schema.replies.author} = ${schema.users.username}) * 5
  + coalesce((
    select count(*)::int from ${schema.replies} r
    where r.author = ${schema.users.username}
      and exists (select 1 from ${schema.posts} p where p."accepted_answer_uid" = r.uid)
  ), 0) * 50
)`;

const profileSelect = {
  username: schema.users.username,
  email: schema.users.email,
  bio: sql<string>`coalesce(${schema.users.bio}, '')`,
  avatar: sql<string>`coalesce(${schema.users.avatar}, '')`,
  link: sql<string>`coalesce(${schema.users.links}, '')`,
  deletedAt: schema.users.deletedAt,
  reputation: reputationSql,
  posted: sql<number>`(
    select count(*)::int from ${schema.posts}
    where ${schema.posts.author} = ${schema.users.username}
  )`,
  answered: sql<number>`(
    select count(*)::int from ${schema.replies}
    where ${schema.replies.author} = ${schema.users.username}
  )`,
  followersCount: sql<number>`(
    select count(*)::int from ${schema.follows}
    where ${schema.follows.followingUsername} = ${schema.users.username}
  )`,
  followingCount: sql<number>`(
    select count(*)::int from ${schema.follows}
    where ${schema.follows.followerUsername} = ${schema.users.username}
  )`,
};

export type BadgeId = "first_post" | "popular_question" | "rising_star" | "helpful" | "energized" | "expert" | "century";

export interface Badge {
  id: BadgeId;
  label: string;
  icon: string;
  earned: boolean;
}

const BADGE_DEFS: { id: BadgeId; label: string; icon: string; check: (stats: BadgeStats) => boolean }[] = [
  { id: "first_post", label: "First Post", icon: "MessageSquare", check: (s) => s.posted >= 1 },
  { id: "energized", label: "Energized", icon: "Zap", check: (s) => s.answered >= 1 },
  { id: "helpful", label: "Helpful", icon: "BadgeCheck", check: (s) => s.acceptedAnswers >= 1 },
  { id: "popular_question", label: "Popular Question", icon: "Star", check: (s) => s.maxPostUpvotes >= 10 },
  { id: "rising_star", label: "Rising Star", icon: "Stars", check: (s) => s.maxPostUpvotes >= 25 },
  { id: "expert", label: "Expert", icon: "Medal", check: (s) => s.acceptedAnswers >= 10 },
  { id: "century", label: "Century", icon: "Award", check: (s) => s.totalUpvotesReceived >= 100 },
];

interface BadgeStats {
  posted: number;
  answered: number;
  maxPostUpvotes: number;
  acceptedAnswers: number;
  totalUpvotesReceived: number;
}

export const computeBadges = async (db: DB, username: string): Promise<Badge[]> => {
  const [stats] = await db
    .select({
      posted: sql<number>`(select count(*)::int from ${schema.posts} where ${schema.posts.author} = ${username})`,
      answered: sql<number>`(select count(*)::int from ${schema.replies} where ${schema.replies.author} = ${username})`,
      maxPostUpvotes: sql<number>`coalesce((select max(${schema.posts.upvotesCount}) from ${schema.posts} where ${schema.posts.author} = ${username}), 0)`,
      acceptedAnswers: sql<number>`coalesce((
        select count(*)::int from ${schema.replies} r
        where r.author = ${username}
          and exists (select 1 from ${schema.posts} p where p."accepted_answer_uid" = r.uid)
      ), 0)`,
      totalUpvotesReceived: sql<number>`(
        coalesce((select sum(${schema.posts.upvotesCount}) from ${schema.posts} where ${schema.posts.author} = ${username}), 0)
        + coalesce((select sum(${schema.replies.upvotesCount}) from ${schema.replies} where ${schema.replies.author} = ${username}), 0)
      )`,
    })
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .limit(1);

  if (!stats) return [];

  return BADGE_DEFS.map((def) => ({
    id: def.id,
    label: def.label,
    icon: def.icon,
    earned: def.check(stats),
  }));
};

export const getProfileByUsername = async (db: DB, username: string, includeEmail: boolean) => {
  const [profile] = await db
    .select(profileSelect)
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .limit(1);

  if (!profile || profile.deletedAt) {
    throw new ApiError(404, "profile not found");
  }

  return includeEmail
    ? profile
    : {
        username: profile.username,
        bio: profile.bio,
        avatar: profile.avatar,
        link: profile.link,
        reputation: profile.reputation,
        posted: profile.posted,
        answered: profile.answered,
        followersCount: profile.followersCount,
        followingCount: profile.followingCount,
      };
};

export const followUser = async (db: DB, follower: string, target: string) => {
  if (follower === target) {
    throw new ApiError(400, "cannot follow yourself");
  }

  const [user] = await db
    .select({ username: schema.users.username, deletedAt: schema.users.deletedAt })
    .from(schema.users)
    .where(eq(schema.users.username, target))
    .limit(1);

  if (!user || user.deletedAt) {
    throw new ApiError(404, "user not found");
  }

  await db.insert(schema.follows).values({
    followerUsername: follower,
    followingUsername: target,
  }).onConflictDoNothing();

  return { message: "user followed" };
};

export const unfollowUser = async (db: DB, follower: string, target: string) => {
  await db.delete(schema.follows).where(
    and(
      eq(schema.follows.followerUsername, follower),
      eq(schema.follows.followingUsername, target),
    ),
  );
  return { message: "user unfollowed" };
};

export const isFollowing = async (db: DB, follower: string | undefined | null, target: string): Promise<boolean> => {
  if (!follower) return false;

  const [row] = await db
    .select({ followingUsername: schema.follows.followingUsername })
    .from(schema.follows)
    .where(
      and(
        eq(schema.follows.followerUsername, follower),
        eq(schema.follows.followingUsername, target),
      ),
    )
    .limit(1);

  return !!row;
};

export const getFollowers = async (db: DB, username: string, limit = 50, offset = 0) => {
  const rows = await db
    .select({
      username: schema.follows.followerUsername,
      avatar: sql<string>`coalesce(${schema.users.avatar}, '')`,
      bio: sql<string>`coalesce(${schema.users.bio}, '')`,
    })
    .from(schema.follows)
    .leftJoin(schema.users, eq(schema.users.username, schema.follows.followerUsername))
    .where(eq(schema.follows.followingUsername, username))
    .orderBy(desc(schema.follows.createdAt))
    .limit(limit)
    .offset(offset);

  return rows;
};

export const getFollowing = async (db: DB, username: string, limit = 50, offset = 0) => {
  const rows = await db
    .select({
      username: schema.follows.followingUsername,
      avatar: sql<string>`coalesce(${schema.users.avatar}, '')`,
      bio: sql<string>`coalesce(${schema.users.bio}, '')`,
    })
    .from(schema.follows)
    .leftJoin(schema.users, eq(schema.users.username, schema.follows.followingUsername))
    .where(eq(schema.follows.followerUsername, username))
    .orderBy(desc(schema.follows.createdAt))
    .limit(limit)
    .offset(offset);

  return rows;
};

export const getFollowedUsernames = async (db: DB, username: string): Promise<string[]> => {
  const rows = await db
    .select({ followingUsername: schema.follows.followingUsername })
    .from(schema.follows)
    .where(eq(schema.follows.followerUsername, username));

  return rows.map((r) => r.followingUsername);
};
