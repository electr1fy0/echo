import type { DB } from "../db";

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
};

export type Variables = {
  db: DB;
  user: string;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: Variables;
};
