import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { schema } from "../db";
import { ApiError } from "../lib/errors";
import { requireAuth } from "../middleware/auth";
import { inMemoryRateLimit } from "../middleware/rateLimit";
import {
  getConversations,
  getOrCreateConversation,
  getMessages,
  createMessage,
  markConversationAsRead,
  getUnreadMessageCount,
  editMessage,
  deleteMessage,
} from "../services/dms";
import { parsePagination } from "../lib/utils";
import { safeParse, createMessageSchema, createConversationSchema, updateMessageSchema } from "../lib/validation";
import type { AppEnv } from "../types/app";

const dmConversationLimiter = inMemoryRateLimit("create-conversation", 30, 60);
const dmMessageLimiter = inMemoryRateLimit("send-message", 60, 60);
const dmEditLimiter = inMemoryRateLimit("edit-message", 30, 60);

export const dmRoutes = new Hono<AppEnv>();

dmRoutes.use("*", requireAuth);

dmRoutes.get("/conversations", async (c) => {
  const convs = await getConversations(c.get("db"), c.get("user"));
  return c.json(convs);
});

dmRoutes.get("/unread-count", async (c) => {
  const count = await getUnreadMessageCount(c.get("db"), c.get("user"));
  return c.json({ count });
});

dmRoutes.post("/conversations/:uid/read", dmMessageLimiter, async (c) => {
  await markConversationAsRead(c.get("db"), c.req.param("uid"), c.get("user"));
  return c.json({ success: true });
});

dmRoutes.get("/conversations/:uid/messages", async (c) => {
  const { limit, offset } = parsePagination(c.req.query());
  const since = c.req.query("since");
  const messages = await getMessages(
    c.get("db"),
    c.req.param("uid"),
    c.get("user"),
    limit,
    offset,
    since,
  );
  return c.json(messages);
});

dmRoutes.post("/conversations/:uid/messages", dmMessageLimiter, async (c) => {
  const body = safeParse(createMessageSchema, await c.req.json());

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

dmRoutes.patch("/conversations/:convUid/messages/:msgUid", dmEditLimiter, async (c) => {
  const body = safeParse(updateMessageSchema, await c.req.json());
  const msg = await editMessage(c.get("db"), c.req.param("convUid"), c.req.param("msgUid"), c.get("user"), body.content);
  if (!msg) throw new ApiError(404, "message not found or not yours");
  return c.json(msg);
});

dmRoutes.delete("/conversations/:convUid/messages/:msgUid", dmEditLimiter, async (c) => {
  const ok = await deleteMessage(c.get("db"), c.req.param("convUid"), c.req.param("msgUid"), c.get("user"));
  if (!ok) throw new ApiError(404, "message not found or not yours");
  return c.json({ success: true });
});

dmRoutes.post("/conversations", dmConversationLimiter, async (c) => {
  const body = safeParse(createConversationSchema, await c.req.json());
  const otherUsername = body.username;

  const currentUser = c.get("user");
  if (otherUsername === currentUser) {
    throw new ApiError(400, "cannot message yourself");
  }

  const [otherUser] = await c
    .get("db")
    .select({ username: schema.users.username, dmEnabled: schema.users.dmEnabled, deletedAt: schema.users.deletedAt })
    .from(schema.users)
    .where(eq(schema.users.username, otherUsername))
    .limit(1);

  if (!otherUser || otherUser.deletedAt) {
    throw new ApiError(404, "user not found");
  }

  if (!otherUser.dmEnabled) {
    throw new ApiError(403, "this user has DMs disabled");
  }

  const conv = await getOrCreateConversation(c.get("db"), currentUser, otherUsername);
  return c.json(conv, 201);
});
