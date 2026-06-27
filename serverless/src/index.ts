import { cors } from "hono/cors";
import { Hono } from "hono";
import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";

import { createDb } from "./db";
import { handleAppError } from "./lib/http";
import { authRoutes } from "./routes/auth";
import { chamberRoutes } from "./routes/chambers";
import { questionRoutes } from "./routes/questions";
import { searchRoutes } from "./routes/search";
import { userRoutes } from "./routes/users";
import { dmRoutes } from "./routes/dms";
import { uploadRoutes, imageRoutes } from "./routes/upload";
import { analyticsRoutes } from "./routes/analytics";
import { linkPreviewRoutes } from "./routes/link-previews";
import { reportRoutes } from "./routes/reports";
import { bookmarkRoutes } from "./routes/bookmarks";
import type { AppEnv, Bindings } from "./types/app";
import { rateLimit } from "./middleware/rateLimit";
import { cacheControl } from "./middleware/cache";
import { registerWelcomeDmHandler } from "./events/welcome-dm";
import { ensureTurnsOutUser } from "./db/seed";
import { UserRoom } from "./durable-objects/room";

export { UserRoom };

registerWelcomeDmHandler();

let seedDone = false;

const seedOnStartup = createMiddleware<AppEnv>(async (c, next) => {
  if (!seedDone) {
    seedDone = true;
    try {
      await ensureTurnsOutUser(c.get("db"));
    } catch (error) {
      console.error("[seed] failed to ensure turnsout user:", error);
      seedDone = false;
    }
  }
  await next();
});

export const app = new Hono<AppEnv>();

app.use("*", async (c, next) => {
  c.set("db", createDb(c.env.DATABASE_URL));
  await next();
});

app.use(
  "*",
  cors({
    origin: (origin, c) => origin || c.env.CORS_ORIGIN || "http://localhost:5173",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    credentials: true,
    maxAge: 86400,
  }),
);

app.use("*", seedOnStartup);
app.use("*", rateLimit("API_LIMITER"));
app.use("*", cacheControl);

app.onError(handleAppError);

app.on(["GET", "HEAD", "POST"], "/ping", (c) => {
  if (c.req.method === "HEAD") {
    return new Response(null, { status: 200 });
  }
  return c.text("pong");
});

app.route("/auth", authRoutes);
app.route("/users", userRoutes);
app.route("/questions", questionRoutes);
app.route("/chambers", chamberRoutes);
app.route("/search", searchRoutes);
app.route("/dms", dmRoutes);
app.route("/upload", uploadRoutes);
app.route("/images", imageRoutes);
app.route("/analytics", analyticsRoutes);
app.route("/link-previews", linkPreviewRoutes);
app.route("/reports", reportRoutes);
app.route("/bookmarks", bookmarkRoutes);

export default {
  fetch(request: Request, env: Bindings, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/ws" && request.headers.get("Upgrade") === "websocket") {
      return handleWebSocketUpgrade(request, env);
    }

    return app.fetch(request, env as Record<string, unknown>, ctx);
  },
};

async function handleWebSocketUpgrade(request: Request, env: Bindings): Promise<Response> {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return new Response("Missing token", { status: 401 });
  }

  try {
    const payload = await verify(token, env.SECRET_KEY, "HS256");
    const username = typeof payload.sub === "string" ? payload.sub : "";
    if (!username) {
      return new Response("Invalid token", { status: 401 });
    }

    const doId = env.USER_ROOM.idFromName(`user-${username}`);
    const stub = env.USER_ROOM.get(doId);
    return stub.fetch(request);
  } catch {
    return new Response("Invalid token", { status: 401 });
  }
}

