CREATE TABLE "user_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text,
	"session_id" text NOT NULL,
	"ip" text,
	"user_agent" text,
	"page" text,
	"referrer" text,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"last_active_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp,
	"duration" integer
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_username_users_username_fk" FOREIGN KEY ("username") REFERENCES "public"."users"("username") ON DELETE set null ON UPDATE cascade;