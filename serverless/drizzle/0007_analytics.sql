CREATE TABLE "analytics_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text,
	"event" text NOT NULL,
	"properties" jsonb DEFAULT '{}'::jsonb,
	"session_id" text,
	"page" text,
	"user_agent" text,
	"ip" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_uid" uuid NOT NULL,
	"username" text,
	"viewed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reputation" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "badges" json DEFAULT '[]'::json NOT NULL;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_username_users_username_fk" FOREIGN KEY ("username") REFERENCES "public"."users"("username") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "post_views" ADD CONSTRAINT "post_views_post_uid_posts_uid_fk" FOREIGN KEY ("post_uid") REFERENCES "public"."posts"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_views" ADD CONSTRAINT "post_views_username_users_username_fk" FOREIGN KEY ("username") REFERENCES "public"."users"("username") ON DELETE set null ON UPDATE cascade;