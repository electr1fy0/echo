import { createMiddleware } from "hono/factory";
import { ApiError } from "../lib/errors";
import type { AppEnv } from "../types/app";

// For fallback in-memory rate limiting (development / tests)
const memoryLimiters = new Map<string, number[]>();

function checkInMemoryLimit(key: string, limit: number, periodSeconds: number): boolean {
  const now = Date.now();
  const windowStart = now - periodSeconds * 1000;
  
  let timestamps = memoryLimiters.get(key) || [];
  timestamps = timestamps.filter((ts) => ts > windowStart);
  
  if (timestamps.length >= limit) {
    memoryLimiters.set(key, timestamps);
    return false;
  }
  
  timestamps.push(now);
  memoryLimiters.set(key, timestamps);
  return true;
}

export type LimiterName = "API_LIMITER" | "AUTH_LIMITER";

interface RateLimitOptions {
  keyPrefix?: string;
  limitFallback?: number; // fallback limit for in-memory
  periodFallback?: number; // fallback period in seconds
}

export const rateLimit = (
  limiterName: LimiterName,
  options: RateLimitOptions = {}
) => {
  const {
    keyPrefix = "global",
    limitFallback = limiterName === "AUTH_LIMITER" ? 200 : 1000,
    periodFallback = 60,
  } = options;

  return createMiddleware<AppEnv>(async (c, next) => {
    // Exclude OPTIONS requests and non-rate-limited paths
    if (c.req.method === "OPTIONS") {
      return next();
    }

    const url = new URL(c.req.url);
    if (
      url.pathname === "/ping" ||
      url.pathname.startsWith("/images/") ||
      url.pathname.endsWith("/unread-count") ||
      url.pathname.endsWith("/read")
    ) {
      return next();
    }

    // Generate rate limit key
    // Identify by auth header if present, otherwise fallback to IP
    const authHeader = c.req.header("Authorization");
    let identifier = "";
    if (authHeader && authHeader.startsWith("Bearer ")) {
      identifier = authHeader;
    } else {
      identifier = c.req.header("CF-Connecting-IP") || "127.0.0.1";
    }

    const key = `${keyPrefix}:${limiterName}:${identifier}`;
    
    // Check if Cloudflare Rate Limiting binding is available
    const binding = c.env ? c.env[limiterName] : undefined;
    if (binding && typeof binding.limit === "function") {
      try {
        const { success } = await binding.limit({ key });
        if (!success) {
          throw new ApiError(429, "Too many requests. Please try again later.");
        }
      } catch (err) {
        // If it's a standard rate limit failure (429), rethrow it
        if (err instanceof ApiError) {
          throw err;
        }
        // Otherwise, log binding error and fallback to in-memory so the app doesn't fail
        console.error(`Rate limiter binding ${limiterName} error:`, err);
        const allowed = checkInMemoryLimit(key, limitFallback, periodFallback);
        if (!allowed) {
          throw new ApiError(429, "Too many requests. Please try again later.");
        }
      }
    } else {
      // Fallback to in-memory rate limiting
      const allowed = checkInMemoryLimit(key, limitFallback, periodFallback);
      if (!allowed) {
        throw new ApiError(429, "Too many requests. Please try again later.");
      }
    }

    await next();
  });
};
