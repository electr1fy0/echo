import { sign, verify } from "hono/jwt";

import { ApiError } from "./errors";

export type AuthTokenPayload = {
  sub: string;
  role: "user";
  access: string[];
  iat: number;
  exp: number;
};

type OnboardingTokenPayload = {
  email: string;
  typ: "google_onboarding";
  iat: number;
  exp: number;
};

export const issueAuthToken = async (secret: string, username: string) =>
  sign(
    {
      sub: username,
      role: "user",
      access: ["view", "create"],
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 48 * 60 * 60,
    } satisfies AuthTokenPayload,
    secret,
    "HS256",
  );

export const verifyAuthToken = async (secret: string, token: string) => {
  const payload = await verify(token, secret, "HS256");
  const sub = typeof payload.sub === "string" ? payload.sub : "";

  if (!sub) {
    throw new ApiError(401, "invalid token");
  }

  return payload as AuthTokenPayload;
};

export const issueGoogleOnboardingToken = async (secret: string, email: string) =>
  sign(
    {
      email,
      typ: "google_onboarding",
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 30 * 60,
    } satisfies OnboardingTokenPayload,
    secret,
    "HS256",
  );

export const verifyGoogleOnboardingToken = async (secret: string, token: string) => {
  const payload = await verify(token, secret, "HS256");

  if (payload.typ !== "google_onboarding" || typeof payload.email !== "string") {
    throw new ApiError(401, "invalid onboarding token");
  }

  return payload.email;
};
