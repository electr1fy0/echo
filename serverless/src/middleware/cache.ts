import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../types/app";
import { cacheNone, cachePrivate } from "../lib/cache";

export const cacheControl = createMiddleware<AppEnv>(async (c, next) => {
  await next();

  if (c.res.headers.has("Cache-Control")) return;

  const method = c.req.method;
  if (method !== "GET" && method !== "HEAD") {
    cacheNone(c);
    return;
  }

  const path = new URL(c.req.url).pathname;
  if (path.startsWith("/auth/") || path.startsWith("/users/me")) {
    cacheNone(c);
    return;
  }

  cachePrivate(c, 30);
});
