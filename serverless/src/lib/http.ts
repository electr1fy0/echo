import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { HTTPException } from "hono/http-exception";

import { isApiError } from "./errors";
import type { AppEnv } from "../types/app";

const jsonError = (c: Context<AppEnv>, message: string, status: ContentfulStatusCode) =>
  c.json({ error: message }, status);

export const handleAppError = (error: unknown, c: Context<AppEnv>) => {
  if (isApiError(error)) {
    return jsonError(c, error.message, error.status as ContentfulStatusCode);
  }

  if (error instanceof HTTPException) {
    return jsonError(c, error.message, error.status);
  }

  if (error instanceof SyntaxError) {
    return jsonError(c, "invalid request body", 400);
  }

  console.error("unhandled error:", error);
  return jsonError(c, "internal server error", 500);
};
