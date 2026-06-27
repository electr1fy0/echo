import type { DB } from "../db";

export interface RateLimit {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export type Bindings = {
  DATABASE_URL: string;
  SECRET_KEY: string;
  CORS_ORIGIN?: string;
  ECHO_DOMAIN?: string;
  RESEND_API_KEY?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URL?: string;
  CLIENT_URL?: string;
  IMAGES_BUCKET: R2Bucket;
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  API_LIMITER?: RateLimit;
  AUTH_LIMITER?: RateLimit;
  USER_ROOM: DurableObjectNamespace;
};

export type Variables = {
  db: DB;
  user: string;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
