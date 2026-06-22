import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { schema } from "../db";
import { ApiError } from "../lib/errors";
import { requireAuth } from "../middleware/auth";
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  createMessage,
} from "../services/dms";
import { parsePagination } from "../lib/utils";
import type { AppEnv } from "../types/app";

export const dmRoutes = new Hono<AppEnv>();

dmRoutes.use("*", requireAuth);

dmRoutes.get("/conversations", async (c) => {
  const convs = await getConversations(c.get("db"), c.get("user"));
  return c.json(convs);
});

dmRoutes.get("/conversations/:uid/messages", async (c) => {
  const { limit, offset } = parsePagination(c.req.query());
  const messages = await getMessages(
    c.get("db"),
    c.req.param("uid"),
    c.get("user"),
    limit,
    offset,
  );
  return c.json(messages);
});

dmRoutes.post("/conversations/:uid/messages", async (c) => {
  const body = (await c.req.json()) as { content?: string };
  if (!body.content?.trim()) {
    throw new ApiError(400, "content is required");
  }

  const msg = await createMessage(
    c.get("db"),
    c.req.param("uid"),
    c.get("user"),
    body.content,
  );

  if (!msg) {
    throw new ApiError(404, "conversation not found or access denied");
  }

  return c.json(msg, 201);
});

dmRoutes.post("/conversations", async (c) => {
  const body = (await c.req.json()) as { username?: string };
  const otherUsername = body.username?.trim();
  if (!otherUsername) {
    throw new ApiError(400, "username is required");
  }

  const currentUser = c.get("user");
  if (otherUsername === currentUser) {
    throw new ApiError(400, "cannot message yourself");
  }

  const [otherUser] = await c
    .get("db")
    .select({ username: schema.users.username, dmEnabled: schema.users.dmEnabled })
    .from(schema.users)
    .where(eq(schema.users.username, otherUsername))
    .limit(1);

  if (!otherUser) {
    throw new ApiError(404, "user not found");
  }

  if (!otherUser.dmEnabled) {
    throw new ApiError(403, "this user has DMs disabled");
  }

  const conv = await getOrCreateConversation(c.get("db"), currentUser, otherUsername);
  return c.json(conv, 201);
});
