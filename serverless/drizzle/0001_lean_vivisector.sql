CREATE TABLE "conversations" (
	"uid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_a" text NOT NULL,
	"participant_b" text NOT NULL,
	"last_message_at" timestamp,
	"last_message_preview" text,
	"last_message_sender" text,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "conversations_participants_key" UNIQUE("participant_a","participant_b")
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"uid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_uid" uuid NOT NULL,
	"sender" text NOT NULL,
	"content" text NOT NULL,
	"time_created" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "partner_applications" (
	"uid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_uid" uuid NOT NULL,
	"applicant_username" text NOT NULL,
	"pitch" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "post_upvotes" (
	"username" text NOT NULL,
	"post_uid" uuid NOT NULL,
	CONSTRAINT "post_upvotes_pkey" PRIMARY KEY("username","post_uid")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"uid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"time_created" timestamp DEFAULT now(),
	"content" text,
	"author" text NOT NULL,
	"chamber_uid" uuid NOT NULL,
	"upvotes_count" integer DEFAULT 0,
	"reddit_upvotes" integer DEFAULT 0,
	"accepted_answer_uid" uuid,
	"pinned_at" timestamp,
	"post_type" text DEFAULT 'qna' NOT NULL,
	"partner_target_grade" text,
	"partner_workstyle" text,
	"partner_slots_needed" integer,
	"trade_price" integer,
	"trade_condition" text,
	"trade_book_isbn" text,
	"trade_status" text DEFAULT 'available',
	"taxi_departure" text,
	"taxi_destination" text,
	"taxi_datetime" text,
	"taxi_seats_available" integer
);
--> statement-breakpoint
CREATE TABLE "replies" (
	"uid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content" text NOT NULL,
	"post_uid" uuid NOT NULL,
	"time_created" timestamp DEFAULT now(),
	"author" text NOT NULL,
	"upvotes_count" integer DEFAULT 0,
	"reddit_upvotes" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "reply_upvotes" (
	"reply_uid" uuid NOT NULL,
	"username" text NOT NULL,
	CONSTRAINT "reply_upvotes_pkey" PRIMARY KEY("reply_uid","username")
);
--> statement-breakpoint
ALTER TABLE "issues" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "questions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "answers" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "answer_upvotes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "question_upvotes" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "issues" CASCADE;--> statement-breakpoint
DROP TABLE "questions" CASCADE;--> statement-breakpoint
DROP TABLE "answers" CASCADE;--> statement-breakpoint
DROP TABLE "answer_upvotes" CASCADE;--> statement-breakpoint
DROP TABLE "question_upvotes" CASCADE;--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "unq_username";--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_actor_username_fkey";
--> statement-breakpoint
ALTER TABLE "notifications" DROP CONSTRAINT "notifications_user_username_fkey";
--> statement-breakpoint
ALTER TABLE "chambers" DROP CONSTRAINT "chambers_creator_username_fkey";
--> statement-breakpoint
ALTER TABLE "chamber_members" DROP CONSTRAINT "chamber_members_chamber_uid_fkey";
--> statement-breakpoint
ALTER TABLE "chamber_members" DROP CONSTRAINT "chamber_members_username_fkey";
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "dm_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "chambers" ADD COLUMN "type" text DEFAULT 'global' NOT NULL;--> statement-breakpoint
ALTER TABLE "chambers" ADD COLUMN "branch_name" text;--> statement-breakpoint
ALTER TABLE "chambers" ADD COLUMN "course_code" text;--> statement-breakpoint
ALTER TABLE "chambers" ADD COLUMN "semester" text;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant_a_users_username_fk" FOREIGN KEY ("participant_a") REFERENCES "public"."users"("username") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_participant_b_users_username_fk" FOREIGN KEY ("participant_b") REFERENCES "public"."users"("username") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_uid_conversations_uid_fk" FOREIGN KEY ("conversation_uid") REFERENCES "public"."conversations"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_users_username_fk" FOREIGN KEY ("sender") REFERENCES "public"."users"("username") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "partner_applications" ADD CONSTRAINT "partner_applications_post_uid_posts_uid_fk" FOREIGN KEY ("post_uid") REFERENCES "public"."posts"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "partner_applications" ADD CONSTRAINT "partner_applications_applicant_username_users_username_fk" FOREIGN KEY ("applicant_username") REFERENCES "public"."users"("username") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "post_upvotes" ADD CONSTRAINT "post_upvotes_username_users_username_fk" FOREIGN KEY ("username") REFERENCES "public"."users"("username") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "post_upvotes" ADD CONSTRAINT "post_upvotes_post_uid_posts_uid_fk" FOREIGN KEY ("post_uid") REFERENCES "public"."posts"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_users_username_fk" FOREIGN KEY ("author") REFERENCES "public"."users"("username") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_chamber_uid_chambers_uid_fk" FOREIGN KEY ("chamber_uid") REFERENCES "public"."chambers"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "replies" ADD CONSTRAINT "replies_post_uid_posts_uid_fk" FOREIGN KEY ("post_uid") REFERENCES "public"."posts"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "replies" ADD CONSTRAINT "replies_author_users_username_fk" FOREIGN KEY ("author") REFERENCES "public"."users"("username") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "reply_upvotes" ADD CONSTRAINT "reply_upvotes_reply_uid_replies_uid_fk" FOREIGN KEY ("reply_uid") REFERENCES "public"."replies"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reply_upvotes" ADD CONSTRAINT "reply_upvotes_username_users_username_fk" FOREIGN KEY ("username") REFERENCES "public"."users"("username") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_username_users_username_fk" FOREIGN KEY ("user_username") REFERENCES "public"."users"("username") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_username_users_username_fk" FOREIGN KEY ("actor_username") REFERENCES "public"."users"("username") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chambers" ADD CONSTRAINT "chambers_creator_username_users_username_fk" FOREIGN KEY ("creator_username") REFERENCES "public"."users"("username") ON DELETE no action ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "chamber_members" ADD CONSTRAINT "chamber_members_chamber_uid_chambers_uid_fk" FOREIGN KEY ("chamber_uid") REFERENCES "public"."chambers"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chamber_members" ADD CONSTRAINT "chamber_members_username_users_username_fk" FOREIGN KEY ("username") REFERENCES "public"."users"("username") ON DELETE cascade ON UPDATE cascade;