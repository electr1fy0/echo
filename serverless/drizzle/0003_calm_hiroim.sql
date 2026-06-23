CREATE TABLE "poll_votes" (
	"uid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"poll_uid" uuid NOT NULL,
	"option_index" integer NOT NULL,
	"username" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "poll_votes_poll_user_unique" UNIQUE("poll_uid","username")
);
--> statement-breakpoint
CREATE TABLE "polls" (
	"uid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_uid" uuid NOT NULL,
	"question" text NOT NULL,
	"options" json NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"is_closed" boolean DEFAULT false
);
--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "partner_status" text DEFAULT 'open';--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "taxi_status" text DEFAULT 'open';--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_poll_uid_polls_uid_fk" FOREIGN KEY ("poll_uid") REFERENCES "public"."polls"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_username_users_username_fk" FOREIGN KEY ("username") REFERENCES "public"."users"("username") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_post_uid_posts_uid_fk" FOREIGN KEY ("post_uid") REFERENCES "public"."posts"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chambers" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "chambers" DROP COLUMN "branch_name";--> statement-breakpoint
ALTER TABLE "chambers" DROP COLUMN "course_code";--> statement-breakpoint
ALTER TABLE "chambers" DROP COLUMN "semester";