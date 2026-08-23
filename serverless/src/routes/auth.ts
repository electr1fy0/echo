import type { Context } from "hono";
import bcrypt from "bcryptjs";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { Hono } from "hono";
import { and, eq, gt, desc, or } from "drizzle-orm";

import { schema } from "../db";
import { issueAuthToken, issueGoogleOnboardingToken, issueOnboardingToken, verifyGoogleOnboardingToken, verifyOnboardingToken } from "../lib/auth";
import { sendOtpEmail, sendPasswordResetEmail, sendVerificationEmail } from "../lib/email";
import { ApiError } from "../lib/errors";
import { requireAuth } from "../middleware/auth";
import { rateLimit } from "../middleware/rateLimit";
import { fetchGoogleProfileEmail } from "../services/google";
import { getProfileByUsername } from "../services/users";
import {
  getClientUrl,
  getGoogleRedirectUrl,
  randomToken,
  randomOtp,
  requireEnv,
} from "../lib/utils";
import { safeParse, signupSchema, signinSchema, verifyEmailSchema, resendVerificationSchema, requestPasswordResetSchema, resetPasswordSchema, sendOtpSchema, verifyOtpSchema, googleOnboardingSchema, usernameSchema } from "../lib/validation";
import { z } from "zod";
import type { AppEnv } from "../types/app";
import { Events, eventBus } from "../lib/events";

export const authRoutes = new Hono<AppEnv>();

authRoutes.use("/signout", requireAuth);
authRoutes.use("/verify", requireAuth);

const authLimiter = rateLimit("AUTH_LIMITER", { keyPrefix: "auth" });
const resendCodeLimiter = rateLimit("AUTH_LIMITER", {
  keyPrefix: "resend-code",
  limitFallback: 3, // 3 requests
  periodFallback: 60, // per 60 seconds
});

authRoutes.use("/signup", authLimiter);
authRoutes.use("/signin", authLimiter);
authRoutes.use("/verify-email", authLimiter);
authRoutes.use("/resend-verification", resendCodeLimiter);
authRoutes.use("/request-password-reset", authLimiter);
authRoutes.use("/reset-password", authLimiter);
authRoutes.use("/send-otp", resendCodeLimiter);
authRoutes.use("/verify-otp", authLimiter);
authRoutes.use("/google/onboarding", authLimiter);
authRoutes.use("/onboarding", authLimiter);
authRoutes.use("/magic-link", authLimiter);
authRoutes.use("/verify-magic-link", authLimiter);

const handleGoogleCallback = async (c: Context<AppEnv>) => {
  const state = c.req.query("state");
  const storedState = getCookie(c, "oauth_state");

  console.log("[google-auth] callback received", {
    hasState: !!state,
    hasStoredState: !!storedState,
    stateMatch: state === storedState,
    state: state?.slice(0, 8) + "...",
    storedState: storedState?.slice(0, 8) + "...",
    url: c.req.url,
  });

  if (!state || !storedState || state !== storedState) {
    throw new ApiError(401, "invalid oauth state");
  }

  deleteCookie(c, "oauth_state", { path: "/" });

  const code = c.req.query("code");
  if (!code) {
    throw new ApiError(400, "missing code");
  }

  const email = await fetchGoogleProfileEmail(c.env, code);
  console.log("[google-auth] profile fetched", { email });

  const [user] = await c
    .get("db")
    .select({ username: schema.users.username })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  const frontendUrl = getClientUrl(c.env);
  console.log("[google-auth] redirecting", {
    userFound: !!user,
    username: user?.username,
    frontendUrl,
  });

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
  const passwordHash = await bcrypt.hash(body.password, 10);

  try {
    await db.insert(schema.users).values({
      username,
      email,
      password: passwordHash,
      isVerified: true,
    });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      if ((error as { constraint?: string }).constraint === "users_email_key") {
        const [existing] = await db
          .select({ isVerified: schema.users.isVerified })
          .from(schema.users)
          .where(eq(schema.users.email, email))
          .limit(1);

        if (existing) {
          await db
            .update(schema.users)
            .set({
              username,
              password: passwordHash,
              isVerified: true,
            })
            .where(eq(schema.users.email, email));
        } else {
          throw new ApiError(409, "email already in use");
        }
      } else {
        throw new ApiError(409, "username already taken");
      }
    } else {
      throw error;
    }
  }

  eventBus.emit(Events.UserRegistered, { username }, {
    db: c.get("db"),
    env: c.env,
    waitUntil: (p) => c.executionCtx.waitUntil(p),
  });

  const token = await issueAuthToken(c.env.SECRET_KEY, username);
  return c.json({ token, message: "Account created successfully" }, 201);
});

authRoutes.post("/signin", async (c) => {
  const body = safeParse(signinSchema, await c.req.json());
  const identifier = body.username.toLowerCase();

  const [user] = await c
    .get("db")
    .select({
      username: schema.users.username,
      password: schema.users.password,
      isVerified: schema.users.isVerified,
      deletedAt: schema.users.deletedAt,
    })
    .from(schema.users)
    .where(or(eq(schema.users.username, identifier), eq(schema.users.email, identifier)))
    .limit(1);

  if (!user?.password || !(await bcrypt.compare(body.password ?? "", user.password))) {
    throw new ApiError(401, "incorrect username or password");
  }

  if (user.deletedAt) {
    throw new ApiError(403, "this account has been deleted");
  }

  if (!user.isVerified) {
    await c.get("db").update(schema.users).set({ isVerified: true }).where(eq(schema.users.username, user.username));
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

  const username = result[0].username;
  const authToken = await issueAuthToken(c.env.SECRET_KEY, username);

  return c.json({ token: authToken, message: "Email verified successfully" });
});

authRoutes.post("/resend-verification", async (c) => {
  return c.json({
    message: "Email verification is not required. You can sign in directly.",
  });
});

authRoutes.post("/request-password-reset", async (c) => {
  throw new ApiError(400, "Password reset via email is disabled. Please sign in with your password or Google.");
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
  console.log("[google-auth] signin-with-google", { clientId: clientId.slice(0, 10) + "...", redirectUri, state: state.slice(0, 8) + "..." });
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

  eventBus.emit(Events.UserRegistered, { username }, {
    db: c.get("db"),
    env: c.env,
    waitUntil: (p) => c.executionCtx.waitUntil(p),
  });

  return c.json({ token: await issueAuthToken(c.env.SECRET_KEY, username) });
});

authRoutes.post("/onboarding", async (c) => {
  const body = safeParse(googleOnboardingSchema, await c.req.json());
  const email = await verifyOnboardingToken(c.env.SECRET_KEY, body.token);
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

  eventBus.emit(Events.UserRegistered, { username }, {
    db: c.get("db"),
    env: c.env,
    waitUntil: (p) => c.executionCtx.waitUntil(p),
  });

  return c.json({ token: await issueAuthToken(c.env.SECRET_KEY, username) });
});

authRoutes.post("/send-otp", async () => {
  throw new ApiError(400, "Email OTP sign-in is disabled. Please sign in with username/password or Google.");
});

authRoutes.post("/verify-otp", async (c) => {
  const body = safeParse(verifyOtpSchema, await c.req.json());
  const { email, otp } = body;

  const [otpRecord] = await c
    .get("db")
    .select()
    .from(schema.otpCodes)
    .where(
      and(
        eq(schema.otpCodes.email, email),
        eq(schema.otpCodes.otp, otp),
        eq(schema.otpCodes.used, false),
        gt(schema.otpCodes.expiresAt, new Date()),
      ),
    )
    .orderBy(schema.otpCodes.createdAt)
    .limit(1);

  if (!otpRecord) {
    throw new ApiError(401, "invalid or expired code");
  }

  await c.get("db").update(schema.otpCodes).set({ used: true }).where(eq(schema.otpCodes.id, otpRecord.id));

  let [user] = await c
    .get("db")
    .select({ username: schema.users.username })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (!user) {
    const onboardingToken = await issueOnboardingToken(c.env.SECRET_KEY, email);
    return c.json({ onboardingToken, needsOnboarding: true });
  }

  return c.json({ token: await issueAuthToken(c.env.SECRET_KEY, user.username) });
});

authRoutes.post("/verify-magic-link", async (c) => {
  const { token } = safeParse(z.object({ token: z.string().min(1) }), await c.req.json());

  const [otpRecord] = await c
    .get("db")
    .select()
    .from(schema.otpCodes)
    .where(
      and(
        eq(schema.otpCodes.magicLinkToken, token),
        eq(schema.otpCodes.used, false),
        gt(schema.otpCodes.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!otpRecord) {
    throw new ApiError(401, "invalid or expired link");
  }

  await c.get("db").update(schema.otpCodes).set({ used: true }).where(eq(schema.otpCodes.id, otpRecord.id));

  let [user] = await c
    .get("db")
    .select({ username: schema.users.username })
    .from(schema.users)
    .where(eq(schema.users.email, otpRecord.email))
    .limit(1);

  if (!user) {
    const onboardingToken = await issueOnboardingToken(c.env.SECRET_KEY, otpRecord.email);
    return c.json({ onboardingToken, needsOnboarding: true });
  }

  return c.json({ token: await issueAuthToken(c.env.SECRET_KEY, user.username) });
});

authRoutes.get("/magic-link", async (c) => {
  const token = c.req.query("token");
  if (!token) {
    throw new ApiError(400, "missing token");
  }

  const [otpRecord] = await c
    .get("db")
    .select()
    .from(schema.otpCodes)
    .where(
      and(
        eq(schema.otpCodes.magicLinkToken, token),
        eq(schema.otpCodes.used, false),
        gt(schema.otpCodes.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!otpRecord) {
    throw new ApiError(401, "invalid or expired link");
  }

  await c.get("db").update(schema.otpCodes).set({ used: true }).where(eq(schema.otpCodes.id, otpRecord.id));

  let [user] = await c
    .get("db")
    .select({ username: schema.users.username })
    .from(schema.users)
    .where(eq(schema.users.email, otpRecord.email))
    .limit(1);

  if (!user) {
    const frontendUrl = getClientUrl(c.env);
    const onboardingToken = await issueOnboardingToken(c.env.SECRET_KEY, otpRecord.email);
    return c.redirect(
      `${frontendUrl}/auth?onboarding=1&onboardingToken=${encodeURIComponent(onboardingToken)}`,
      302,
    );
  }

  const jwt = await issueAuthToken(c.env.SECRET_KEY, user.username);
  const frontendUrl = getClientUrl(c.env);
  return c.redirect(`${frontendUrl}/auth?token=${encodeURIComponent(jwt)}`, 302);
});

authRoutes.post("/signout", (c) => c.body(null, 200));

authRoutes.get("/check-username", async (c) => {
  const username = c.req.query("username");
  if (!username) {
    return c.json({ available: false, error: "username is required" });
  }

  const result = usernameSchema.safeParse(username);
  if (!result.success) {
    return c.json({ available: false, error: result.error.issues[0].message });
  }

  const [existing] = await c
    .get("db")
    .select({ username: schema.users.username })
    .from(schema.users)
    .where(eq(schema.users.username, result.data))
    .limit(1);

  if (existing) {
    return c.json({ available: false, error: "username already taken" });
  }

  return c.json({ available: true });
});

authRoutes.get("/verify", async (c) => {
  try {
    const profile = await getProfileByUsername(c.get("db"), c.get("user"), true);
    return c.json(profile);
  } catch (e) {
    throw new ApiError(401, "session expired");
  }
});
