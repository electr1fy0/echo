import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

import { isApiError } from "./errors";
import type { AppEnv } from "../types/app";

export const toErrorResponse = (message: string) => ({ error: message });

export const handleAppError = (error: unknown, c: Context<AppEnv>) => {
  if (isApiError(error)) {
    return new Response(JSON.stringify(toErrorResponse(error.message)), {
      status: error.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (error instanceof HTTPException) {
    return new Response(JSON.stringify(toErrorResponse(error.message)), {
      status: error.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (error instanceof SyntaxError) {
    return new Response(JSON.stringify(toErrorResponse("invalid request body")), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.error("unhandled error:", error);
  const message = error instanceof Error ? error.message : "internal error";
  return new Response(JSON.stringify(toErrorResponse(message)), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
};
