import { Hono } from "hono";
import { eq } from "drizzle-orm";

import { schema } from "../db";
import { requireAuth, optionalAuth } from "../middleware/auth";
import {
  batchTrackEvents,
  trackPostView,
  getUserAnalytics,
  getPostAnalytics,
  checkAndAwardMilestones,
} from "../services/analytics";
import type { AppEnv } from "../types/app";
import { ApiError } from "../lib/errors";

export const analyticsRoutes = new Hono<AppEnv>();

analyticsRoutes.use("*", requireAuth);

analyticsRoutes.post("/events", async (c) => {
  const body = (await c.req.json()) as {
    events?: {
      event: string;
      properties?: Record<string, unknown>;
      page?: string;
    }[];
  };

  const user = c.get("user");
  const events = body.events ?? [];

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

  await checkAndAwardMilestones(c.get("db"), user);

  return c.json({ message: "events tracked" });
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
