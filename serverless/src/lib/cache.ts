import type { Context } from "hono";
import type { AppEnv } from "../types/app";

type CacheDirective = {
  public?: boolean;
  private?: boolean;
  maxAge?: number;
  sMaxage?: number;
  noCache?: boolean;
  noStore?: boolean;
  mustRevalidate?: boolean;
  staleWhileRevalidate?: number;
};

const buildCacheControl = (directive: CacheDirective): string => {
  const parts: string[] = [];
  if (directive.noStore) return "no-store";
  if (directive.noCache) parts.push("no-cache");
  if (directive.public) parts.push("public");
  if (directive.private) parts.push("private");
  if (directive.maxAge !== undefined) parts.push(`max-age=${directive.maxAge}`);
  if (directive.sMaxage !== undefined) parts.push(`s-maxage=${directive.sMaxage}`);
  if (directive.mustRevalidate) parts.push("must-revalidate");
  if (directive.staleWhileRevalidate !== undefined) parts.push(`stale-while-revalidate=${directive.staleWhileRevalidate}`);
  return parts.join(", ");
};

export const setCache = (c: Context<AppEnv>, directive: CacheDirective) => {
  c.header("Cache-Control", buildCacheControl(directive));
};

export const cachePublic = (c: Context<AppEnv>, maxAge = 60, sMaxage = 300) => {
  setCache(c, { public: true, maxAge, sMaxage, staleWhileRevalidate: 600 });
};

export const cachePrivate = (c: Context<AppEnv>, maxAge = 10) => {
  setCache(c, { private: true, maxAge });
};

export const cacheNone = (c: Context<AppEnv>) => {
  setCache(c, { noStore: true });
};
