-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
/*
CREATE TABLE "notifications" (
	"uid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_username" text NOT NULL,
	"actor_username" text,
	"type" text NOT NULL,
	"reference_uid" uuid NOT NULL,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "notifications_dedupe_unique" UNIQUE("user_username","actor_username","type","reference_uid")
);
--> statement-breakpoint
CREATE TABLE "issues" (
	"id" uuid DEFAULT gen_random_uuid(),
	"title" text,
	"room" text,
	"category" text,
	"priority" text,
	"assignee" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"username" text PRIMARY KEY NOT NULL,
	"password" text,
	"email" text NOT NULL,
	"bio" text DEFAULT 'Wanderer',
	"avatar" text,
	"answered" integer DEFAULT 0,
	"posted" integer DEFAULT 0,
	"verification_token" text,
	"is_verified" boolean DEFAULT false,
	"links" text,
	"reset_token" text,
	"reset_expiry" timestamp,
	CONSTRAINT "unq_username" UNIQUE("username"),
	CONSTRAINT "users_email_key" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "chambers" (
	"uid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"creator_username" text,
	"created_at" timestamp DEFAULT now(),
	"color_index" integer DEFAULT 0,
	CONSTRAINT "chambers_name_key" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"uid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"time_created" timestamp DEFAULT now(),
	"content" text,
	"author" text NOT NULL,
	"chamber_uid" uuid NOT NULL,
	"upvotes_count" integer DEFAULT 0,
	"reddit_upvotes" integer DEFAULT 0,
	"accepted_answer_uid" uuid,
	"pinned_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "answers" (
	"uid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"question_uid" uuid NOT NULL,
	"time_created" timestamp DEFAULT now(),
	"author" text NOT NULL,
	"upvotes_count" integer DEFAULT 0,
	"reddit_upvotes" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "answer_upvotes" (
	"answer_uid" uuid NOT NULL,
	"username" text NOT NULL,
	CONSTRAINT "answer_upvotes_pkey" PRIMARY KEY("answer_uid","username")
);
--> statement-breakpoint
CREATE TABLE "question_upvotes" (
	"username" text NOT NULL,
	"question_uid" uuid NOT NULL,
	CONSTRAINT "votes_pkey" PRIMARY KEY("username","question_uid")
);
--> statement-breakpoint
CREATE TABLE "chamber_members" (
	"chamber_uid" uuid NOT NULL,
	"username" text NOT NULL,
	"joined_at" timestamp DEFAULT now(),
	CONSTRAINT "chamber_members_pkey" PRIMARY KEY("chamber_uid","username")
);
--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_username_fkey" FOREIGN KEY ("actor_username") REFERENCES "public"."users"("username") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_username_fkey" FOREIGN KEY ("user_username") REFERENCES "public"."users"("username") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chambers" ADD CONSTRAINT "chambers_creator_username_fkey" FOREIGN KEY ("creator_username") REFERENCES "public"."users"("username") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_accepted_answer_fkey" FOREIGN KEY ("accepted_answer_uid") REFERENCES "public"."answers"("uid") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_author_fkey" FOREIGN KEY ("author") REFERENCES "public"."users"("username") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "questions" ADD CONSTRAINT "questions_chamber_uid_fkey" FOREIGN KEY ("chamber_uid") REFERENCES "public"."chambers"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answer_question_uid_fkey" FOREIGN KEY ("question_uid") REFERENCES "public"."questions"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answers" ADD CONSTRAINT "answers_author_fkey" FOREIGN KEY ("author") REFERENCES "public"."users"("username") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "answer_upvotes" ADD CONSTRAINT "answer_upvotes_answer_uid_fkey" FOREIGN KEY ("answer_uid") REFERENCES "public"."answers"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "answer_upvotes" ADD CONSTRAINT "answer_upvotes_username_fkey" FOREIGN KEY ("username") REFERENCES "public"."users"("username") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "question_upvotes" ADD CONSTRAINT "votes_question_uid_fkey" FOREIGN KEY ("question_uid") REFERENCES "public"."questions"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "question_upvotes" ADD CONSTRAINT "votes_username_fkey" FOREIGN KEY ("username") REFERENCES "public"."users"("username") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chamber_members" ADD CONSTRAINT "chamber_members_chamber_uid_fkey" FOREIGN KEY ("chamber_uid") REFERENCES "public"."chambers"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chamber_members" ADD CONSTRAINT "chamber_members_username_fkey" FOREIGN KEY ("username") REFERENCES "public"."users"("username") ON DELETE cascade ON UPDATE cascade;
*/