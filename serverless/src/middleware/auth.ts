import { createMiddleware } from "hono/factory";

import { ApiError } from "../lib/errors";
import { verifyAuthToken } from "../lib/auth";
import type { AppEnv } from "../types/app";

const parseBearerToken = (authorization?: string) => {
  if (!authorization) {
    throw new ApiError(401, "missing token");
  }

  if (!authorization.startsWith("Bearer ")) {
    throw new ApiError(401, "invalid authorization header");
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) {
    throw new ApiError(401, "invalid token");
  }

  return token;
};

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  try {
    const token = parseBearerToken(c.req.header("Authorization"));
    const payload = await verifyAuthToken(c.env.SECRET_KEY, token);
    c.set("user", payload.sub);
    await next();
  } catch (error) {
    throw error instanceof ApiError ? error : new ApiError(401, "invalid token");
  }
});

export const optionalAuth = createMiddleware<AppEnv>(async (c, next) => {
  const authorization = c.req.header("Authorization");
  if (authorization && authorization.startsWith("Bearer ")) {
    const token = authorization.slice("Bearer ".length).trim();
    if (token) {
      try {
        const payload = await verifyAuthToken(c.env.SECRET_KEY, token);
        c.set("user", payload.sub);
      } catch {
        // Ignore invalid token and treat as guest
      }
    }
  }
  await next();
});

