import { ApiError } from "../lib/errors";
import { getGoogleRedirectUrl, requireEnv } from "../lib/utils";
import type { Bindings } from "../types/app";

export const fetchGoogleProfileEmail = async (env: Bindings, code: string) => {
  const clientId = requireEnv(env.GOOGLE_CLIENT_ID, "GOOGLE_CLIENT_ID");
  const clientSecret = requireEnv(env.GOOGLE_CLIENT_SECRET, "GOOGLE_CLIENT_SECRET");
  const redirectUri = getGoogleRedirectUrl(env);

  console.log("[google-auth] exchanging code for token", {
    clientId: clientId.slice(0, 10) + "...",
    redirectUri,
    hasCode: !!code,
    codeLength: code?.length,
  });

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
    const body = await tokenResponse.text();
    console.error("[google-auth] token exchange failed", {
      status: tokenResponse.status,
      body,
    });
    throw new ApiError(502, "oauth exchange failed");
  }

  const tokenJson = (await tokenResponse.json()) as { access_token?: string };
  if (!tokenJson.access_token) {
    console.error("[google-auth] no access_token in response", { tokenJson });
    throw new ApiError(502, "oauth exchange failed");
  }

  console.log("[google-auth] token exchange succeeded, fetching profile");

  const profileResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: {
      Authorization: `Bearer ${tokenJson.access_token}`,
    },
  });

  if (!profileResponse.ok) {
    const body = await profileResponse.text();
    console.error("[google-auth] profile fetch failed", {
      status: profileResponse.status,
      body,
    });
    throw new ApiError(502, "failed to fetch profile");
  }

  const profileJson = (await profileResponse.json()) as { email?: string };
  if (!profileJson.email) {
    console.error("[google-auth] no email in profile response", { profileJson });
    throw new ApiError(400, "email not provided by google");
  }

  console.log("[google-auth] profile fetched", { email: profileJson.email });
  return profileJson.email.trim().toLowerCase();
};
