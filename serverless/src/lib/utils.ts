import { ApiError } from "./errors";
import type { Bindings } from "../types/app";

export const MAX_POST_WORDS = 5000;

export const countWords = (text: string) =>
  text.trim().split(/\s+/).filter(Boolean).length;

export const mentionPattern = /@([a-zA-Z0-9_]+)/g;

export const parsePagination = (query: Record<string, string | undefined>) => {
  const limitValue = Number.parseInt(query.limit ?? "500", 10);
  const offsetValue = Number.parseInt(query.offset ?? "0", 10);

  return {
    limit: Number.isFinite(limitValue) ? limitValue : 500,
    offset: Number.isFinite(offsetValue) ? offsetValue : 0,
  };
};

export const randomToken = (byteLength: number) => {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return Array.from(bytes, (byte: number) => byte.toString(16).padStart(2, "0")).join("");
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

export const extractMentions = (content: string) => {
  const usernames = new Set<string>();

  for (const match of content.matchAll(mentionPattern)) {
    const username = match[1]?.trim();
    if (username) {
      usernames.add(username);
    }
  }

  return [...usernames];
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
