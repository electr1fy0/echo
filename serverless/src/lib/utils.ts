import { ApiError } from "./errors";
import type { Bindings } from "../types/app";

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

export const getClientUrl = (env: Bindings) => env.CLIENT_URL ?? "http://localhost:5173";

export const getGoogleRedirectUrl = (env: Bindings) =>
  env.GOOGLE_REDIRECT_URL ?? "http://localhost:8080/auth/google/callback";

export const requireEnv = (value: string | undefined, name: string) => {
  if (!value) {
    throw new ApiError(500, `${name} is required`);
  }

  return value;
};

export const normalizeUsername = (username: string) => username.trim();

export const ensureValidUsername = (username: string) => {
  if (!username || username.includes(" ")) {
    throw new ApiError(400, "username cannot contain spaces");
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
