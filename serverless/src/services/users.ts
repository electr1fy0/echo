import { eq, sql } from "drizzle-orm";

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
  reputation: reputationSql,
  posted: sql<number>`(
    select count(*)::int from ${schema.posts}
    where ${schema.posts.author} = ${schema.users.username}
  )`,
  answered: sql<number>`(
    select count(*)::int from ${schema.replies}
    where ${schema.replies.author} = ${schema.users.username}
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

  if (!profile) {
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
      };
};
