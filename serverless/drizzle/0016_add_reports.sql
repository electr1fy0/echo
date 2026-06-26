CREATE TABLE IF NOT EXISTS "reports" (
	"uid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_username" text NOT NULL,
	"target_type" text NOT NULL,
	"target_uid" uuid NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_username_users_username_fk" FOREIGN KEY ("reporter_username") REFERENCES "public"."users"("username") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_unique" UNIQUE ("reporter_username", "target_type", "target_uid");
