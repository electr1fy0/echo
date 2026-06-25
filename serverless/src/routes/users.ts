import { Hono } from "hono";
import { eq, inArray } from "drizzle-orm";

import { schema } from "../db";
import { ApiError } from "../lib/errors";
import { requireAuth } from "../middleware/auth";
import { listNotifications, countUnreadNotifications, markNotificationsAsRead } from "../services/notifications";
import { getPostItems, searchUsers } from "../services/questions";
import { getProfileByUsername, computeBadges, followUser, unfollowUser, isFollowing, getFollowers, getFollowing } from "../services/users";
import { ensureValidUsername } from "../lib/utils";
import { sendEmailChangeOtp, sendEmailChangeNotification } from "../lib/email";
import { safeParse, updateProfileSchema, resolveUsernamesSchema, changeEmailSchema, confirmEmailChangeSchema } from "../lib/validation";
import type { AppEnv } from "../types/app";
import { parsePagination } from "../lib/utils";

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

userRoutes.patch("/me", async (c) => {
  const body = safeParse(updateProfileSchema, await c.req.json());
  const currentUsername = c.get("user");
  const requestedUsername = body.username?.trim();
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
  if (body.bio !== undefined) updates.bio = body.bio;
  if (body.avatar !== undefined) updates.avatar = body.avatar;
  if (body.link !== undefined) updates.links = body.link;
  if (body.dmEnabled !== undefined) updates.dmEnabled = body.dmEnabled;

  await c.get("db").update(schema.users).set(updates).where(eq(schema.users.username, currentUsername));

  return nextUsername === currentUsername
    ? c.json({ message: "profile updated" })
    : c.json({ token: await import("../lib/auth").then((m) => m.issueAuthToken(c.env.SECRET_KEY, nextUsername)) });
});

userRoutes.delete("/me", async (c) => {
  await c.get("db").delete(schema.users).where(eq(schema.users.username, c.get("user")));
  return c.json({ message: "Account deleted successfully" });
});

userRoutes.post("/me/email-change", async (c) => {
  const body = safeParse(changeEmailSchema, await c.req.json());
  const username = c.get("user");
  const newEmail = body.new_email;

  const [user] = await c.get("db")
    .select({ email: schema.users.email })
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .limit(1);

  if (user.email === newEmail) {
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

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await c.get("db").update(schema.users).set({
    newEmail,
    emailChangeToken: otp,
    emailChangeExpiry: otpExpiry,
  }).where(eq(schema.users.username, username));

  c.executionCtx.waitUntil(
    sendEmailChangeOtp(c.env, user.email, username, otp).catch((error) => {
      console.error("failed to send email change OTP", error);
    }),
  );

  return c.json({ message: "OTP sent to your current email" });
});

userRoutes.post("/me/email-change/confirm", async (c) => {
  const body = safeParse(confirmEmailChangeSchema, await c.req.json());
  const username = c.get("user");

  const [user] = await c.get("db")
    .select({
      email: schema.users.email,
      newEmail: schema.users.newEmail,
      emailChangeToken: schema.users.emailChangeToken,
      emailChangeExpiry: schema.users.emailChangeExpiry,
    })
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .limit(1);

  if (!user?.newEmail || !user.emailChangeToken) {
    throw new ApiError(400, "no pending email change");
  }

  if (user.emailChangeToken !== body.otp) {
    throw new ApiError(401, "invalid OTP");
  }

  if (!user.emailChangeExpiry || user.emailChangeExpiry.getTime() < Date.now()) {
    throw new ApiError(400, "OTP expired");
  }

  const oldEmail = user.email;

  await c.get("db").update(schema.users).set({
    email: user.newEmail,
    newEmail: null,
    emailChangeToken: null,
    emailChangeExpiry: null,
  }).where(eq(schema.users.username, username));

  c.executionCtx.waitUntil(
    sendEmailChangeNotification(c.env, oldEmail, username).catch((error) => {
      console.error("failed to send email change notification", error);
    }),
  );

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

userRoutes.post("/me/notifications/read", async (c) => {
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
    .where(inArray(schema.users.username, usernames));

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

userRoutes.post("/:username/follow", requireAuth, async (c) => {
  const target = c.req.param("username");
  const result = await followUser(c.get("db"), c.get("user"), target);
  return c.json(result);
});

userRoutes.delete("/:username/follow", requireAuth, async (c) => {
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
