import { and, desc, eq, gte, sql } from "drizzle-orm";

import type { DB } from "../db";
import { schema } from "../db";
import { createNotification } from "./notifications";

export const trackEvent = async (
  db: DB,
  event: {
    username?: string | null;
    event: string;
    properties?: Record<string, unknown>;
    sessionId?: string | null;
    page?: string | null;
    userAgent?: string | null;
    ip?: string | null;
  },
) => {
  await db.insert(schema.analyticsEvents).values({
    username: event.username ?? null,
    event: event.event,
    properties: event.properties ?? {},
    sessionId: event.sessionId ?? null,
    page: event.page ?? null,
    userAgent: event.userAgent ?? null,
    ip: event.ip ?? null,
  });
};

export const batchTrackEvents = async (
  db: DB,
  events: {
    username?: string | null;
    event: string;
    properties?: Record<string, unknown>;
    sessionId?: string | null;
    page?: string | null;
    userAgent?: string | null;
    ip?: string | null;
  }[],
) => {
  if (!events.length) return;
  await db.insert(schema.analyticsEvents).values(
    events.map((e) => ({
      username: e.username ?? null,
      event: e.event,
      properties: e.properties ?? {},
      sessionId: e.sessionId ?? null,
      page: e.page ?? null,
      userAgent: e.userAgent ?? null,
      ip: e.ip ?? null,
    })),
  );
};

export const trackPostView = async (
  db: DB,
  postUid: string,
  username?: string | null,
) => {
  await db.insert(schema.postViews).values({
    postUid,
    username: username ?? null,
  });
};

export const getUserAnalytics = async (db: DB, username: string) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyActivity = await db
    .select({
      date: sql<string>`DATE(${schema.analyticsEvents.createdAt})`,
      posts: sql<number>`COALESCE(COUNT(*) FILTER (WHERE ${schema.analyticsEvents.event} = 'post_create'), 0)`,
      replies: sql<number>`COALESCE(COUNT(*) FILTER (WHERE ${schema.analyticsEvents.event} = 'reply_create'), 0)`,
      upvotesReceived: sql<number>`COALESCE(COUNT(*) FILTER (WHERE ${schema.analyticsEvents.event} = 'upvote_received'), 0)`,
    })
    .from(schema.analyticsEvents)
    .where(
      and(
        eq(schema.analyticsEvents.username, username),
        gte(schema.analyticsEvents.createdAt, thirtyDaysAgo),
      ),
    )
    .groupBy(sql`DATE(${schema.analyticsEvents.createdAt})`)
    .orderBy(sql`DATE(${schema.analyticsEvents.createdAt})`);

  const [totals] = await db
    .select({
      posts: sql<number>`(select count(*)::int from ${schema.posts} where ${schema.posts.author} = ${username})`,
      replies: sql<number>`(select count(*)::int from ${schema.replies} where ${schema.replies.author} = ${username})`,
      upvotesReceived: sql<number>`(
        coalesce((select sum(${schema.posts.upvotesCount}) from ${schema.posts} where ${schema.posts.author} = ${username}), 0)
        + coalesce((select sum(${schema.replies.upvotesCount}) from ${schema.replies} where ${schema.replies.author} = ${username}), 0)
      )`,
      upvotesGiven: sql<number>`(
        coalesce((select count(*)::int from ${schema.postUpvotes} where ${schema.postUpvotes.username} = ${username}), 0)
        + coalesce((select count(*)::int from ${schema.replyUpvotes} where ${schema.replyUpvotes.username} = ${username}), 0)
      )`,
    })
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .limit(1);

  const [profileViews] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.analyticsEvents)
    .where(
      and(
        eq(schema.analyticsEvents.event, "profile_view"),
        eq(schema.analyticsEvents.properties, sql`(${JSON.stringify({ target: username })}::jsonb)`),
      ),
    );

  const topPosts = await db
    .select({
      uid: schema.posts.uid,
      content: schema.posts.content,
      upvotes: schema.posts.upvotesCount,
    })
    .from(schema.posts)
    .where(eq(schema.posts.author, username))
    .orderBy(desc(schema.posts.upvotesCount))
    .limit(5);

  const topPostsWithViews = await Promise.all(
    topPosts.map(async (post) => {
      const [viewCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(schema.postViews)
        .where(eq(schema.postViews.postUid, post.uid));
      return { ...post, views: viewCount?.count ?? 0 };
    }),
  );

  const activityRows = await db
    .select({
      date: sql<string>`DATE(${schema.analyticsEvents.createdAt})`,
      events: sql<number>`count(*)::int`,
    })
    .from(schema.analyticsEvents)
    .where(
      and(
        eq(schema.analyticsEvents.username, username),
        gte(schema.analyticsEvents.createdAt, thirtyDaysAgo),
      ),
    )
    .groupBy(sql`DATE(${schema.analyticsEvents.createdAt})`)
    .orderBy(sql`DATE(${schema.analyticsEvents.createdAt})`);

  const dates = new Map<string, number>();
  for (let i = 0; i < 30; i++) {
    const d = new Date(thirtyDaysAgo);
    d.setDate(d.getDate() + i);
    dates.set(d.toISOString().split("T")[0], 0);
  }
  for (const row of activityRows) {
    dates.set(row.date, row.events);
  }

  let currentStreak = 0;
  const sortedDates = [...dates.entries()].sort(([a], [b]) => b.localeCompare(a));
  for (const [, count] of sortedDates) {
    if (count > 0) currentStreak++;
    else break;
  }

  const replyRate = (totals?.posts ?? 0) > 0
    ? Math.round(((totals?.replies ?? 0) / (totals?.posts ?? 1)) * 100)
    : 0;
  const avgUpvotesPerPost = (totals?.posts ?? 0) > 0
    ? Math.round(((totals?.upvotesReceived ?? 0) / (totals?.posts ?? 1)) * 10) / 10
    : 0;

  return {
    activity: dailyActivity,
    topPosts: topPostsWithViews,
    totals: {
      posts: totals?.posts ?? 0,
      replies: totals?.replies ?? 0,
      upvotesReceived: totals?.upvotesReceived ?? 0,
      upvotesGiven: totals?.upvotesGiven ?? 0,
      profileViews: profileViews?.count ?? 0,
    },
    streaks: {
      currentStreak,
      longestStreak: currentStreak,
    },
    engagement: {
      replyRate,
      avgUpvotesPerPost,
    },
    calendar: [...dates.entries()].map(([date, count]) => ({ date, count })),
  };
};

export const getPostAnalytics = async (db: DB, postUid: string, username: string) => {
  const [post] = await db
    .select({ author: schema.posts.author })
    .from(schema.posts)
    .where(eq(schema.posts.uid, postUid))
    .limit(1);

  if (!post) return null;
  if (post.author !== username) return null;

  const [viewCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.postViews)
    .where(eq(schema.postViews.postUid, postUid));

  const [uniqueViewers] = await db
    .select({ count: sql<number>`count(distinct ${schema.postViews.username})::int` })
    .from(schema.postViews)
    .where(
      and(
        eq(schema.postViews.postUid, postUid),
        sql`${schema.postViews.username} is not null`,
      ),
    );

  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const viewsTrend = await db
    .select({
      date: sql<string>`DATE(${schema.postViews.viewedAt})`,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.postViews)
    .where(
      and(
        eq(schema.postViews.postUid, postUid),
        gte(schema.postViews.viewedAt, fourteenDaysAgo),
      ),
    )
    .groupBy(sql`DATE(${schema.postViews.viewedAt})`)
    .orderBy(sql`DATE(${schema.postViews.viewedAt})`);

  const [replyCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.replies)
    .where(eq(schema.replies.postUid, postUid));

  return {
    totalViews: viewCount?.count ?? 0,
    uniqueViewers: uniqueViewers?.count ?? 0,
    replyCount: replyCount?.count ?? 0,
    viewsTrend,
  };
};

const MILESTONE_CONFIG: { key: string; label: string; check: (stats: { posts: number; replies: number; upvotesReceived: number; totalViews: number }) => boolean }[] = [
  { key: "milestone_first_post", label: "First Post 🎉", check: (s) => s.posts >= 1 },
  { key: "milestone_10_posts", label: "10 Posts ✨", check: (s) => s.posts >= 10 },
  { key: "milestone_50_posts", label: "50 Posts 🔥", check: (s) => s.posts >= 50 },
  { key: "milestone_first_reply", label: "First Reply 💬", check: (s) => s.replies >= 1 },
  { key: "milestone_50_upvotes", label: "50 Upvotes Received ⭐", check: (s) => s.upvotesReceived >= 50 },
  { key: "milestone_100_upvotes", label: "100 Upvotes Received 🏆", check: (s) => s.upvotesReceived >= 100 },
  { key: "milestone_500_upvotes", label: "500 Upvotes Received 💎", check: (s) => s.upvotesReceived >= 500 },
  { key: "milestone_100_views", label: "100 Profile Views 👀", check: (s) => s.totalViews >= 100 },
  { key: "milestone_1000_views", label: "1,000 Profile Views 🌟", check: (s) => s.totalViews >= 1000 },
];

export const checkAndAwardMilestones = async (db: DB, username: string) => {
  const [stats] = await db
    .select({
      posts: sql<number>`(select count(*)::int from ${schema.posts} where ${schema.posts.author} = ${username})`,
      replies: sql<number>`(select count(*)::int from ${schema.replies} where ${schema.replies.author} = ${username})`,
      upvotesReceived: sql<number>`(
        coalesce((select sum(${schema.posts.upvotesCount}) from ${schema.posts} where ${schema.posts.author} = ${username}), 0)
        + coalesce((select sum(${schema.replies.upvotesCount}) from ${schema.replies} where ${schema.replies.author} = ${username}), 0)
      )`,
      totalViews: sql<number>`(select count(*)::int from ${schema.postViews} pv join ${schema.posts} p on p.uid = pv.post_uid where p.author = ${username})`,
    })
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .limit(1);

  if (!stats) return;

  const existingMilestones = await db
    .select({ properties: schema.analyticsEvents.properties })
    .from(schema.analyticsEvents)
    .where(
      and(
        eq(schema.analyticsEvents.username, username),
        eq(schema.analyticsEvents.event, "milestone_achieved"),
      ),
    );

  const alreadyAwarded = new Set(
    existingMilestones.map((m) => m.properties?.milestone_key as string).filter(Boolean),
  );

  for (const milestone of MILESTONE_CONFIG) {
    if (alreadyAwarded.has(milestone.key)) continue;
    if (!milestone.check(stats)) continue;

    await trackEvent(db, {
      username,
      event: "milestone_achieved",
      properties: { milestone_key: milestone.key, label: milestone.label },
    });

    await createNotification(db, {
      userUsername: username,
      actorUsername: username,
      type: "milestone",
      referenceUid: username,
    });
  }
};
