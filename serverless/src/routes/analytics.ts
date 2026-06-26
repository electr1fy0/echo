import { Hono } from "hono";
import { eq, and, gte, sql, isNull, desc } from "drizzle-orm";

import { schema } from "../db";
import { requireAuth, optionalAuth } from "../middleware/auth";
import {
  batchTrackEvents,
  trackPostView,
  getUserAnalytics,
  getPostAnalytics,
  checkAndAwardMilestones,
} from "../services/analytics";
import { safeParse, trackEventsSchema } from "../lib/validation";
import type { AppEnv } from "../types/app";
import { ApiError } from "../lib/errors";

export const analyticsRoutes = new Hono<AppEnv>();

analyticsRoutes.use("*", requireAuth);

analyticsRoutes.post("/events", async (c) => {
  const body = safeParse(trackEventsSchema, await c.req.json());
  const user = c.get("user");
  const events = body.events;

  if (!events.length) {
    return c.json({ message: "no events" });
  }

  await batchTrackEvents(
    c.get("db"),
    events.map((e) => ({
      username: user,
      event: e.event,
      properties: e.properties,
      page: e.page ?? null,
      sessionId: null,
      userAgent: c.req.header("user-agent") ?? null,
      ip: c.req.header("cf-connecting-ip") ?? null,
    })),
  );

  const milestoneEvents = new Set(["post_create", "reply_create", "upvote_received", "profile_view"]);
  if (events.some((e) => milestoneEvents.has(e.event))) {
    await checkAndAwardMilestones(c.get("db"), user);
  }

  return c.json({ message: "events tracked" });
});

analyticsRoutes.post("/session/heartbeat", async (c) => {
  const user = c.get("user");
  const { sessionId, page, referrer } = await c.req.json();

  const [existing] = await c.get("db")
    .select({ id: schema.userSessions.id })
    .from(schema.userSessions)
    .where(eq(schema.userSessions.sessionId, sessionId))
    .limit(1);

  if (existing) {
    await c.get("db").update(schema.userSessions).set({
      lastActiveAt: new Date(),
      page,
      referrer,
      userAgent: c.req.header("user-agent") ?? null,
      ip: c.req.header("cf-connecting-ip") ?? null,
    }).where(eq(schema.userSessions.id, existing.id));
  } else {
    await c.get("db").insert(schema.userSessions).values({
      username: user,
      sessionId,
      page,
      referrer,
      userAgent: c.req.header("user-agent") ?? null,
      ip: c.req.header("cf-connecting-ip") ?? null,
    });
  }

  return c.json({ message: "heartbeat recorded" });
});

analyticsRoutes.get("/admin", async (c) => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [totalUsers] = await c.get("db").select({ count: sql<number>`count(*)::int` }).from(schema.users).where(isNull(schema.users.deletedAt));
  const [activeToday] = await c.get("db").select({ count: sql<number>`count(distinct ${schema.userSessions.username})::int` }).from(schema.userSessions).where(and(gte(schema.userSessions.lastActiveAt, todayStart), sql`${schema.userSessions.username} is not null`));
  const [active7d] = await c.get("db").select({ count: sql<number>`count(distinct ${schema.userSessions.username})::int` }).from(schema.userSessions).where(and(gte(schema.userSessions.lastActiveAt, sevenDaysAgo), sql`${schema.userSessions.username} is not null`));
  const [active30d] = await c.get("db").select({ count: sql<number>`count(distinct ${schema.userSessions.username})::int` }).from(schema.userSessions).where(and(gte(schema.userSessions.lastActiveAt, thirtyDaysAgo), sql`${schema.userSessions.username} is not null`));

  const [totalPosts] = await c.get("db").select({ count: sql<number>`count(*)::int` }).from(schema.posts);
  const [totalReplies] = await c.get("db").select({ count: sql<number>`count(*)::int` }).from(schema.replies);
  const [totalEvents] = await c.get("db").select({ count: sql<number>`count(*)::int` }).from(schema.analyticsEvents);

  const eventBreakdown = await c.get("db")
    .select({
      event: schema.analyticsEvents.event,
      count: sql<number>`count(*)::int`,
    })
    .from(schema.analyticsEvents)
    .where(gte(schema.analyticsEvents.createdAt, thirtyDaysAgo))
    .groupBy(schema.analyticsEvents.event)
    .orderBy(desc(sql`count(*)::int`));

  return c.json({
    users: {
      total: totalUsers?.count ?? 0,
      activeToday: activeToday?.count ?? 0,
      active7d: active7d?.count ?? 0,
      active30d: active30d?.count ?? 0,
    },
    content: {
      posts: totalPosts?.count ?? 0,
      replies: totalReplies?.count ?? 0,
    },
    events: {
      total: totalEvents?.count ?? 0,
      breakdown: eventBreakdown,
    },
  });
});

analyticsRoutes.get("/me", async (c) => {
  const data = await getUserAnalytics(c.get("db"), c.get("user"));
  return c.json(data);
});

analyticsRoutes.get("/questions/:uid", async (c) => {
  const uid = c.req.param("uid");
  const data = await getPostAnalytics(c.get("db"), uid, c.get("user"));

  if (data === null) {
    throw new ApiError(404, "post not found or not authorized");
  }

  return c.json(data);
});

analyticsRoutes.post("/questions/:uid/view", optionalAuth, async (c) => {
  const uid = c.req.param("uid");

  const [post] = await c
    .get("db")
    .select({ uid: schema.posts.uid })
    .from(schema.posts)
    .where(eq(schema.posts.uid, uid))
    .limit(1);

  if (!post) {
    throw new ApiError(404, "post not found");
  }

  let username: string | null = null;
  try { username = c.get("user"); } catch {}

  await trackPostView(c.get("db"), uid, username);
  return c.json({ message: "view tracked" });
});
