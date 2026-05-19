import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";

import { isApiError } from "./errors";
import type { AppEnv } from "../types/app";

export const toErrorResponse = (message: string) => ({ error: message });

export const handleAppError = (error: unknown, c: Context<AppEnv>) => {
  if (isApiError(error)) {
    return c.newResponse(JSON.stringify(toErrorResponse(error.message)), error.status as 400, {
      "Content-Type": "application/json",
    });
  }

  if (error instanceof HTTPException) {
    return c.newResponse(JSON.stringify(toErrorResponse(error.message)), error.status as 400, {
      "Content-Type": "application/json",
    });
  }

  console.error(error);
  return c.json(toErrorResponse("internal error"), 500);
};
