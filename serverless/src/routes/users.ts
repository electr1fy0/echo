import { Hono } from "hono";
import { eq, inArray } from "drizzle-orm";

import { schema } from "../db";
import { ApiError } from "../lib/errors";
import { requireAuth } from "../middleware/auth";
import { listNotifications } from "../services/notifications";
import { getQuestionItems, searchUsers } from "../services/questions";
import { getProfileByUsername } from "../services/users";
import { ensureValidUsername } from "../lib/utils";
import type { AppEnv } from "../types/app";
import { parsePagination } from "../lib/utils";

export const userRoutes = new Hono<AppEnv>();

userRoutes.use("/me", requireAuth);
userRoutes.use("/me/*", requireAuth);
userRoutes.use("/search", requireAuth);
userRoutes.use("/resolve", requireAuth);

userRoutes.get("/me", async (c) => c.json(await getProfileByUsername(c.get("db"), c.get("user"), true)));

userRoutes.patch("/me", async (c) => {
  const body = (await c.req.json()) as {
    username?: string;
    bio?: string;
    avatar?: string;
    link?: string;
  };
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

  await c.get("db").update(schema.users).set({
    username: nextUsername,
    bio: body.bio ?? "",
    avatar: body.avatar ?? "",
    links: body.link ?? "",
  }).where(eq(schema.users.username, currentUsername));

  return nextUsername === currentUsername
    ? c.json({ message: "profile updated" })
    : c.json({ token: await import("../lib/auth").then((m) => m.issueAuthToken(c.env.SECRET_KEY, nextUsername)) });
});

userRoutes.delete("/me", async (c) => {
  await c.get("db").delete(schema.users).where(eq(schema.users.username, c.get("user")));
  return c.json({ message: "Account deleted successfully" });
});

userRoutes.get("/me/questions", async (c) => {
  const { limit, offset } = parsePagination(c.req.query());
  return c.json(await getQuestionItems(c.get("db"), c.get("user"), { limit, offset, author: c.get("user") }));
});

userRoutes.get("/me/notifications", async (c) => {
  const { limit, offset } = parsePagination(c.req.query());
  return c.json(await listNotifications(c.get("db"), c.get("user"), limit, offset));
});

userRoutes.get("/search", async (c) => {
  const query = c.req.query("q") ?? "";
  return c.json(query ? await searchUsers(c.get("db"), query) : []);
});

userRoutes.post("/resolve", async (c) => {
  const body = (await c.req.json()) as { usernames?: string[] };
  const usernames = body.usernames ?? [];
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
  return c.json(await getProfileByUsername(c.get("db"), c.req.param("username"), false));
});
