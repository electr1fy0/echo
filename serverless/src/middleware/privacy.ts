import { createMiddleware } from "hono/factory";
import type { AppEnv } from "../types/app";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function redactAnonymousPostAuthors(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactAnonymousPostAuthors);
  }

  if (!isRecord(value)) return value;

  const redacted: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(value)) {
    redacted[key] = redactAnonymousPostAuthors(child);
  }

  const question = redacted.question;
  if (!isRecord(question) || question.isAnonymous !== true) {
    return redacted;
  }

  if (question.authorUsername === "[deleted]") {
    return redacted;
  }

  redacted.question = {
    ...question,
    authorUsername: "Anonymous",
  };
  redacted.author = {
    username: "Anonymous",
    avatar: "",
  };

  return redacted;
}

export const redactAnonymousPostResponses = createMiddleware<AppEnv>(async (c, next) => {
  await next();

  const contentType = c.res.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return;

  let payload: unknown;
  try {
    payload = await c.res.clone().json();
  } catch {
    return;
  }

  const headers = new Headers(c.res.headers);
  headers.delete("content-length");

  c.res = new Response(JSON.stringify(redactAnonymousPostAuthors(payload)), {
    status: c.res.status,
    statusText: c.res.statusText,
    headers,
  });
});
