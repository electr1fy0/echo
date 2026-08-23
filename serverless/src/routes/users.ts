import { Hono } from "hono";
import { and, eq, inArray, isNull } from "drizzle-orm";

import { schema } from "../db";
import { ApiError } from "../lib/errors";
import { requireAuth } from "../middleware/auth";
import { inMemoryRateLimit } from "../middleware/rateLimit";
import { listNotifications, countUnreadNotifications, markNotificationsAsRead } from "../services/notifications";
import { getPostItems, searchUsers } from "../services/questions";
import { getProfileByUsername, computeBadges, followUser, unfollowUser, isFollowing, getFollowers, getFollowing } from "../services/users";
import { ensureValidUsername } from "../lib/utils";
import { sendEmailChangeOtp, sendEmailChangeNotification } from "../lib/email";
import { safeParse, updateProfileSchema, resolveUsernamesSchema, changeEmailSchema, confirmEmailChangeSchema } from "../lib/validation";
import type { AppEnv } from "../types/app";
import { parsePagination } from "../lib/utils";

const profileUpdateLimiter = inMemoryRateLimit("update-profile", 30, 60);
const emailChangeLimiter = inMemoryRateLimit("email-change", 10, 60);
const followLimiter = inMemoryRateLimit("follow", 60, 60);
const accountDeleteLimiter = inMemoryRateLimit("delete-account", 60, 60);

export const userRoutes = new Hono<AppEnv>();

userRoutes.use("/me", requireAuth);
userRoutes.use("/me/*", requireAuth);
userRoutes.use("/search", requireAuth);
userRoutes.use("/resolve", requireAuth);

userRoutes.get("/me", async (c) => {
  const profile = await getProfileByUsername(c.get("db"), c.get("user"), true);
  const [userRow] = await c.get("db").select({ dmEnabled: schema.users.dmEnabled }).from(schema.users).where(eq(schema.users.username, c.get("user"))).limit(1);
  const badges = await computeBadges(c.get("db"), c.get("user"));
  return c.json({ ...profile, dmEnabled: userRow?.dmEnabled ?? true, badges });
});

userRoutes.patch("/me", profileUpdateLimiter, async (c) => {
  const body = safeParse(updateProfileSchema, await c.req.json());
  const currentUsername = c.get("user");
  const requestedUsername = body.username?.trim()?.toLowerCase();
  const nextUsername = requestedUsername && requestedUsername !== currentUsername
    ? requestedUsername
    : currentUsername;

  if (requestedUsername && requestedUsername !== currentUsername) {
    ensureValidUsername(requestedUsername);
    const [existing] = await c.get("db").select({ username: schema.users.username }).from(schema.users).where(eq(schema.users.username, requestedUsername)).limit(1);
    if (existing) {
      throw new ApiError(409, "username already taken");
    }
  }

  const updates: Record<string, unknown> = {};
  if (body.username !== undefined) updates.username = nextUsername;
  if (body.email !== undefined) {
    const requestedEmail = body.email.trim().toLowerCase();
    const [currentUser] = await c.get("db").select({ email: schema.users.email }).from(schema.users).where(eq(schema.users.username, currentUsername)).limit(1);
    if (currentUser && currentUser.email !== requestedEmail) {
      const [existing] = await c.get("db").select({ username: schema.users.username }).from(schema.users).where(eq(schema.users.email, requestedEmail)).limit(1);
      if (existing) {
        throw new ApiError(409, "email already in use");
      }
      updates.email = requestedEmail;
    }
  }
  if (body.bio !== undefined) updates.bio = body.bio;
  if (body.avatar !== undefined) updates.avatar = body.avatar;
  if (body.link !== undefined) updates.links = body.link;
  if (body.dmEnabled !== undefined) updates.dmEnabled = body.dmEnabled;
  if (body.tourSeen !== undefined) updates.tourSeen = body.tourSeen;

  await c.get("db").update(schema.users).set(updates).where(eq(schema.users.username, currentUsername));

  return nextUsername === currentUsername
    ? c.json({ message: "profile updated" })
    : c.json({ token: await import("../lib/auth").then((m) => m.issueAuthToken(c.env.SECRET_KEY, nextUsername)) });
});

userRoutes.delete("/me", accountDeleteLimiter, async (c) => {
  await c.get("db").update(schema.users).set({
    deletedAt: new Date(),
    password: null,
    email: `deleted-${c.get("user")}@deleted.local`,
    bio: null,
    avatar: null,
    links: null,
    dmEnabled: false,
  }).where(eq(schema.users.username, c.get("user")));
  return c.json({ message: "Account deleted successfully" });
});

userRoutes.post("/me/email-change", emailChangeLimiter, async (c) => {
  const body = safeParse(changeEmailSchema, await c.req.json());
  const username = c.get("user");
  const newEmail = body.new_email.trim().toLowerCase();

  const [user] = await c.get("db")
    .select({ email: schema.users.email })
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .limit(1);

  if (user?.email === newEmail) {
    throw new ApiError(400, "new email is the same as your current email");
  }

  const [existing] = await c.get("db")
    .select({ username: schema.users.username })
    .from(schema.users)
    .where(eq(schema.users.email, newEmail))
    .limit(1);

  if (existing) {
    throw new ApiError(409, "email already in use");
  }

  await c.get("db").update(schema.users).set({
    email: newEmail,
    newEmail: null,
    emailChangeToken: null,
    emailChangeExpiry: null,
  }).where(eq(schema.users.username, username));

  return c.json({ message: "Email updated successfully" });
});

userRoutes.post("/me/email-change/confirm", emailChangeLimiter, async (c) => {
  return c.json({ message: "Email updated successfully" });
});

userRoutes.get("/me/questions", async (c) => {
  const { limit, offset } = parsePagination(c.req.query());
  return c.json(await getPostItems(c.get("db"), c.get("user"), { limit, offset, author: c.get("user") }));
});

userRoutes.get("/me/notifications", async (c) => {
  const { limit, offset } = parsePagination(c.req.query());
  return c.json(await listNotifications(c.get("db"), c.get("user"), limit, offset));
});

userRoutes.post("/me/notifications/read", profileUpdateLimiter, async (c) => {
  await markNotificationsAsRead(c.get("db"), c.get("user"));
  return c.json({ success: true });
});

userRoutes.get("/me/notifications/unread-count", requireAuth, async (c) => {
  const count = await countUnreadNotifications(c.get("db"), c.get("user"));
  return c.json({ count });
});

userRoutes.get("/search", async (c) => {
  const query = c.req.query("q") ?? "";
  return c.json(query ? await searchUsers(c.get("db"), query) : []);
});

userRoutes.post("/resolve", async (c) => {
  const body = safeParse(resolveUsernamesSchema, await c.req.json());
  const usernames = body.usernames;
  if (!usernames.length) {
    return c.json({ existing: [] });
  }

  const users = await c
    .get("db")
    .select({ username: schema.users.username })
    .from(schema.users)
    .where(
      and(
        inArray(schema.users.username, usernames),
        isNull(schema.users.deletedAt),
      ),
    );

  return c.json({ existing: users.map((user) => user.username) });
});

userRoutes.get("/:username", async (c) => {
  const targetUsername = c.req.param("username");
  const profile = await getProfileByUsername(c.get("db"), targetUsername, false);
  const badges = await computeBadges(c.get("db"), targetUsername);

  let isUserFollowing = false;
  try { isUserFollowing = await isFollowing(c.get("db"), c.get("user"), targetUsername); } catch {}

  return c.json({ ...profile, badges, isFollowing: isUserFollowing });
});

userRoutes.post("/:username/follow", requireAuth, followLimiter, async (c) => {
  const target = c.req.param("username");
  const result = await followUser(c.get("db"), c.get("user"), target);
  return c.json(result);
});

userRoutes.delete("/:username/follow", requireAuth, followLimiter, async (c) => {
  const target = c.req.param("username");
  const result = await unfollowUser(c.get("db"), c.get("user"), target);
  return c.json(result);
});

userRoutes.get("/:username/followers", async (c) => {
  const { limit, offset } = parsePagination(c.req.query());
  const rows = await getFollowers(c.get("db"), c.req.param("username"), limit, offset);
  return c.json(rows);
});

userRoutes.get("/:username/following", async (c) => {
  const { limit, offset } = parsePagination(c.req.query());
  const rows = await getFollowing(c.get("db"), c.req.param("username"), limit, offset);
  return c.json(rows);
});
