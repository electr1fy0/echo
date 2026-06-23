import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { rateLimit } from "../middleware/rateLimit";
import { ApiError } from "../lib/errors";
import { generatePresignedPutUrl } from "../lib/s3";
import type { AppEnv } from "../types/app";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const MAX_SIZE = 6 * 1024 * 1024;

const imageUrl = (c: { env: { ECHO_DOMAIN?: string }; req: { url: string } }, key: string) => {
  const origin = new URL(c.req.url).origin;
  return `${origin}/images/${key}`;
};

export const uploadRoutes = new Hono<AppEnv>();

uploadRoutes.use("*", rateLimit("AUTH_LIMITER", { keyPrefix: "upload", limitFallback: 30, periodFallback: 60 }));

uploadRoutes.post("/presign", requireAuth, async (c) => {
  const { filename, contentType } = (await c.req.json()) as {
    filename?: string;
    contentType?: string;
  };

  if (!filename || !contentType) {
    throw new ApiError(400, "filename and contentType are required");
  }
  if (!ALLOWED_TYPES.includes(contentType)) {
    throw new ApiError(400, `unsupported content type, allowed: ${ALLOWED_TYPES.join(", ")}`);
  }

  const ext = filename.split(".").pop() || "bin";
  const key = `uploads/${crypto.randomUUID()}.${ext}`;

  const presignedUrl = await generatePresignedPutUrl(
    c.env.R2_ACCOUNT_ID,
    c.env.R2_ACCESS_KEY_ID,
    c.env.R2_SECRET_ACCESS_KEY,
    "echo-images",
    key,
  );

  return c.json({ url: presignedUrl, publicUrl: imageUrl(c, key), key });
});

uploadRoutes.post("/", requireAuth, async (c) => {
  const body = await c.req.parseBody();
  const file = body["file"] as File | undefined;

  if (!file) {
    throw new ApiError(400, "file is required");
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new ApiError(400, `unsupported content type, allowed: ${ALLOWED_TYPES.join(", ")}`);
  }
  if (file.size > MAX_SIZE) {
    throw new ApiError(400, "file too large, max 6MB");
  }

  const ext = file.name.split(".").pop() || "bin";
  const key = `uploads/${crypto.randomUUID()}.${ext}`;

  await c.env.IMAGES_BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  return c.json({ url: imageUrl(c, key), key });
});

export const imageRoutes = new Hono<AppEnv>();

imageRoutes.get("/*", async (c) => {
  const key = c.req.path.replace("/images/", "");
  const obj = await c.env.IMAGES_BUCKET.get(key);

  if (!obj) {
    throw new ApiError(404, "image not found");
  }

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return new Response(obj.body, { headers });
});
