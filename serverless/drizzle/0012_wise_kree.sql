CREATE TABLE "otp_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"otp" text NOT NULL,
	"magic_link_token" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "otp_codes_magic_link_token_unique" UNIQUE("magic_link_token")
);
--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "participant_a_last_read_at" timestamp;--> statement-breakpoint
ALTER TABLE "conversations" ADD COLUMN "participant_b_last_read_at" timestamp;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "actor_is_anonymous" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "is_anonymous" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "replies" ADD COLUMN "is_anonymous" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "new_email" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_change_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_change_expiry" timestamp;