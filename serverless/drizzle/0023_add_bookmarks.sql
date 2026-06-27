CREATE TABLE "bookmarks" (
	"username" text NOT NULL,
	"post_uid" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "bookmarks_pkey" PRIMARY KEY("username","post_uid")
);
--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "accepts_answers" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_username_users_username_fk" FOREIGN KEY ("username") REFERENCES "public"."users"("username") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_post_uid_posts_uid_fk" FOREIGN KEY ("post_uid") REFERENCES "public"."posts"("uid") ON DELETE cascade ON UPDATE no action;