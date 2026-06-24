import type { Context } from "hono";
import bcrypt from "bcryptjs";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { Hono } from "hono";
import { eq } from "drizzle-orm";

import { schema } from "../db";
import { issueAuthToken, issueGoogleOnboardingToken, verifyGoogleOnboardingToken } from "../lib/auth";
import { sendPasswordResetEmail, sendVerificationEmail } from "../lib/email";
import { ApiError } from "../lib/errors";
import { requireAuth } from "../middleware/auth";
import { rateLimit } from "../middleware/rateLimit";
import { fetchGoogleProfileEmail } from "../services/google";
import { getProfileByUsername } from "../services/users";
import {
  getClientUrl,
  getGoogleRedirectUrl,
  randomToken,
  requireEnv,
} from "../lib/utils";
import { safeParse, signupSchema, signinSchema, verifyEmailSchema, resendVerificationSchema, requestPasswordResetSchema, resetPasswordSchema, googleOnboardingSchema } from "../lib/validation";
import type { AppEnv } from "../types/app";

export const authRoutes = new Hono<AppEnv>();

authRoutes.use("/signout", requireAuth);
authRoutes.use("/verify", requireAuth);

const authLimiter = rateLimit("AUTH_LIMITER", { keyPrefix: "auth" });
authRoutes.use("/signup", authLimiter);
authRoutes.use("/signin", authLimiter);
authRoutes.use("/verify-email", authLimiter);
authRoutes.use("/resend-verification", authLimiter);
authRoutes.use("/request-password-reset", authLimiter);
authRoutes.use("/reset-password", authLimiter);
authRoutes.use("/google/onboarding", authLimiter);

const handleGoogleCallback = async (c: Context<AppEnv>) => {
  const state = c.req.query("state");
  const storedState = getCookie(c, "oauth_state");

  if (!state || !storedState || state !== storedState) {
    throw new ApiError(401, "invalid oauth state");
  }

  deleteCookie(c, "oauth_state", { path: "/" });

  const code = c.req.query("code");
  if (!code) {
    throw new ApiError(400, "missing code");
  }

  const email = await fetchGoogleProfileEmail(c.env, code);
  const [user] = await c
    .get("db")
    .select({ username: schema.users.username })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  const frontendUrl = getClientUrl(c.env);
  if (user) {
    const token = await issueAuthToken(c.env.SECRET_KEY, user.username);
    return c.redirect(`${frontendUrl}/auth?token=${encodeURIComponent(token)}`, 307);
  }

  const onboardingToken = await issueGoogleOnboardingToken(c.env.SECRET_KEY, email);
  return c.redirect(
    `${frontendUrl}/auth?onboarding=1&onboardingToken=${encodeURIComponent(onboardingToken)}`,
    307,
  );
};

authRoutes.post("/signup", async (c) => {
  const db = c.get("db");
  const body = safeParse(signupSchema, await c.req.json());

  const username = body.username;
  const email = body.email;
  // TODO: re-enable college email restriction
  // if (!email.endsWith("@vitstudent.ac.in")) {
  //   throw new ApiError(400, "only @vitstudent.ac.in emails are allowed");
  // }
  const passwordHash = await bcrypt.hash(body.password, 10);
  const verificationToken = randomToken(32);

  try {
    await db.insert(schema.users).values({
      username,
      email,
      password: passwordHash,
      verificationToken,
      isVerified: false,
    });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      if ((error as { constraint?: string }).constraint === "users_email_key") {
        throw new ApiError(409, "email already in use");
      }
      throw new ApiError(409, "username already taken");
    }
    throw error;
  }

  c.executionCtx.waitUntil(
    sendVerificationEmail(c.env, email, username, verificationToken).catch((error) => {
      console.error("failed to send verification email", error);
    }),
  );

  return c.json({ message: "Please check your email to verify your account" }, 201);
});

authRoutes.post("/signin", async (c) => {
  const body = safeParse(signinSchema, await c.req.json());
  const username = body.username;

  const [user] = await c
    .get("db")
    .select({
      username: schema.users.username,
      password: schema.users.password,
      isVerified: schema.users.isVerified,
    })
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .limit(1);

  if (!user?.password || !(await bcrypt.compare(body.password ?? "", user.password))) {
    throw new ApiError(401, "incorrect username or password");
  }

  if (!user.isVerified) {
    throw new ApiError(403, "please verify your email before signing in");
  }

  return c.json({ token: await issueAuthToken(c.env.SECRET_KEY, user.username) });
});

authRoutes.post("/verify-email", async (c) => {
  const body = safeParse(verifyEmailSchema, await c.req.json());
  const token = body.token;

  const result = await c
    .get("db")
    .update(schema.users)
    .set({ isVerified: true, verificationToken: null })
    .where(eq(schema.users.verificationToken, token))
    .returning({ username: schema.users.username });

  if (!result.length) {
    throw new ApiError(400, "invalid or expired token");
  }

  const authToken = await issueAuthToken(c.env.SECRET_KEY, result[0].username);
  return c.json({ token: authToken, message: "Email verified successfully" });
});

authRoutes.post("/resend-verification", async (c) => {
  const body = safeParse(resendVerificationSchema, await c.req.json());
  const email = body.email;

  const [user] = await c
    .get("db")
    .select({ username: schema.users.username, isVerified: schema.users.isVerified })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (user) {
    if (user.isVerified) {
      throw new ApiError(400, "account is already verified");
    }

    const verificationToken = randomToken(32);
    await c.get("db").update(schema.users).set({ verificationToken }).where(eq(schema.users.email, email));

    c.executionCtx.waitUntil(
      sendVerificationEmail(c.env, email, user.username, verificationToken).catch((error) => {
        console.error("failed to resend verification email", error);
      }),
    );
  }

  return c.json({
    message: "If an account exists and is not verified, a verification email has been sent",
  });
});

authRoutes.post("/request-password-reset", async (c) => {
  const body = safeParse(requestPasswordResetSchema, await c.req.json());
  const email = body.email;

  const [user] = await c
    .get("db")
    .select({ username: schema.users.username })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (user) {
    const resetToken = randomToken(32);
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000);

    await c.get("db").update(schema.users).set({ resetToken, resetExpiry }).where(eq(schema.users.email, email));

    c.executionCtx.waitUntil(
      sendPasswordResetEmail(c.env, email, user.username, resetToken).catch((error) => {
        console.error("failed to send password reset email", error);
      }),
    );
  }

  return c.json({ message: "If an account exists, a reset email has been sent" });
});

authRoutes.post("/reset-password", async (c) => {
  const body = safeParse(resetPasswordSchema, await c.req.json());
  const token = body.token;

  const [user] = await c
    .get("db")
    .select({ email: schema.users.email, resetExpiry: schema.users.resetExpiry })
    .from(schema.users)
    .where(eq(schema.users.resetToken, token))
    .limit(1);

  if (!user) {
    throw new ApiError(400, "invalid or expired token");
  }

  if (!user.resetExpiry || user.resetExpiry.getTime() < Date.now()) {
    throw new ApiError(400, "token expired");
  }

  const passwordHash = await bcrypt.hash(body.new_password ?? "", 10);

  await c.get("db").update(schema.users).set({
    password: passwordHash,
    resetToken: null,
    resetExpiry: null,
  }).where(eq(schema.users.email, user.email));

  return c.json({ message: "Password updated successfully" });
});

authRoutes.get("/signin-with-google", async (c) => {
  const state = randomToken(32);

  setCookie(c, "oauth_state", state, {
    httpOnly: true,
    secure: c.req.url.startsWith("https://"),
    sameSite: "Lax",
    path: "/",
    maxAge: 600,
  });

  const clientId = requireEnv(c.env.GOOGLE_CLIENT_ID, "GOOGLE_CLIENT_ID");
  const redirectUri = getGoogleRedirectUrl(c.env);
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile");
  authUrl.searchParams.set("state", state);

  return c.redirect(authUrl.toString(), 307);
});

authRoutes.get("/callback", handleGoogleCallback);
authRoutes.get("/google/callback", handleGoogleCallback);

authRoutes.post("/google/onboarding", async (c) => {
  const body = safeParse(googleOnboardingSchema, await c.req.json());
  const email = await verifyGoogleOnboardingToken(c.env.SECRET_KEY, body.token);
  // TODO: re-enable college email restriction
  // if (!email.endsWith("@vitstudent.ac.in")) {
  //   throw new ApiError(400, "only @vitstudent.ac.in emails are allowed");
  // }
  const username = body.username;

  const [existingUsername] = await c
    .get("db")
    .select({ username: schema.users.username })
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .limit(1);

  if (existingUsername) {
    throw new ApiError(409, "username already taken");
  }

  const [existingUserByEmail] = await c
    .get("db")
    .select({ username: schema.users.username })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (existingUserByEmail) {
    return c.json({ token: await issueAuthToken(c.env.SECRET_KEY, existingUserByEmail.username) });
  }

  await c.get("db").insert(schema.users).values({ username, email, isVerified: true });
  return c.json({ token: await issueAuthToken(c.env.SECRET_KEY, username) });
});

authRoutes.post("/signout", (c) => c.body(null, 200));

authRoutes.get("/verify", async (c) => c.json(await getProfileByUsername(c.get("db"), c.get("user"), true)));
