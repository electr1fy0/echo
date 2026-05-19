import { ApiError } from "../lib/errors";
import { getGoogleRedirectUrl, requireEnv } from "../lib/utils";
import type { Bindings } from "../types/app";

export const fetchGoogleProfileEmail = async (env: Bindings, code: string) => {
  const clientId = requireEnv(env.GOOGLE_CLIENT_ID, "GOOGLE_CLIENT_ID");
  const clientSecret = requireEnv(env.GOOGLE_CLIENT_SECRET, "GOOGLE_CLIENT_SECRET");
  const redirectUri = getGoogleRedirectUrl(env);

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenResponse.ok) {
    throw new ApiError(502, "oauth exchange failed");
  }

  const tokenJson = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenJson.access_token) {
    throw new ApiError(502, "oauth exchange failed");
  }

  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${tokenJson.access_token}`,
    },
  });

  if (!profileResponse.ok) {
    throw new ApiError(502, "failed to fetch profile");
  }

  const profileJson = (await profileResponse.json()) as { email?: string };
  if (!profileJson.email) {
    throw new ApiError(400, "email not provided by google");
  }

  return profileJson.email.trim().toLowerCase();
};
