import { eq, or, sql, type SQL } from "drizzle-orm";
import { ApiError } from "./errors";
import type { Bindings } from "../types/app";

export const MAX_POST_WORDS = 5000;

export const countWords = (text: string) =>
  text.trim().split(/\s+/).filter(Boolean).length;

const mentionRegex = /@([a-zA-Z0-9_-]+)/g;

export const extractMentions = (content: string): string[] => {
  const usernames = new Set<string>();
  for (const match of content.matchAll(mentionRegex)) {
    if (match[1]) usernames.add(match[1]);
  }
  return [...usernames];
};

/**
 * Matches a UUID column OR a slug column against a user-provided identifier.
 * The identifier can be either a UUID or a slug string.
 * Uses ::text cast on the UUID column so PostgreSQL can compare against a string.
 */
export const matchesIdentifier = (
  uidColumn: any,
  slugColumn: any,
  identifier: string,
): SQL => or(sql`${uidColumn}::text = ${identifier}`, eq(slugColumn, identifier))!;

export const parsePagination = (query: Record<string, string | undefined>) => {
  const limitValue = Number.parseInt(query.limit ?? "50", 10);
  const offsetValue = Number.parseInt(query.offset ?? "0", 10);

  return {
    limit: Number.isFinite(limitValue) ? limitValue : 50,
    offset: Number.isFinite(offsetValue) ? offsetValue : 0,
  };
};

export const randomToken = (byteLength: number) => {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return Array.from(bytes, (byte: number) => byte.toString(16).padStart(2, "0")).join("");
};

export const randomOtp = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(3));
  const num = (bytes[0] << 16) | (bytes[1] << 8) | bytes[2];
  return String(100000 + (num % 900000));
};

export const getClientUrl = (env: Bindings) => {
  if (env.CLIENT_URL) return env.CLIENT_URL;
  if (env.ECHO_DOMAIN) {
    if (env.ECHO_DOMAIN.startsWith("http://") || env.ECHO_DOMAIN.startsWith("https://")) {
      return env.ECHO_DOMAIN;
    }
    return `https://${env.ECHO_DOMAIN}`;
  }
  return "http://localhost:5173";
};

export const getGoogleRedirectUrl = (env: Bindings) =>
  env.GOOGLE_REDIRECT_URL ?? "http://localhost:8787/auth/google/callback";

export const requireEnv = (value: string | undefined, name: string) => {
  if (!value) {
    throw new ApiError(500, `${name} is required`);
  }

  return value;
};

export const normalizeUsername = (username: string) => username.trim();

export const ensureValidUsername = (username: string) => {
  if (!username) {
    throw new ApiError(400, "username is required");
  }
  if (username.length < 3 || username.length > 20) {
    throw new ApiError(400, "username must be between 3 and 20 characters");
  }
  if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(username)) {
    throw new ApiError(400, "username must start with a letter and contain only letters, numbers, underscores, and hyphens");
  }
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/<[^>]*>/g, "")  // strip HTML tags
    .replace(/[^\w\s-]/g, "") // remove non-word chars (except whitespace/hyphen)
    .replace(/[\s_]+/g, "-")  // spaces/underscores to hyphens
    .replace(/-+/g, "-")      // collapse hyphens
    .replace(/^-+|-+$/g, "")  // trim hyphens
    .slice(0, 40)             // limit length
    .replace(/-+$/, "")       // trim trailing hyphens again after slicing
    || "untitled";
};
