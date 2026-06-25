import { cors } from "hono/cors";
import { Hono } from "hono";

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
import type { AppEnv } from "./types/app";
import { rateLimit } from "./middleware/rateLimit";

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

app.use("*", rateLimit("API_LIMITER"));

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

export default app;
