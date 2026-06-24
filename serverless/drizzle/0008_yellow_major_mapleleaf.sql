CREATE TABLE "follows" (
	"follower_username" text NOT NULL,
	"following_username" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "follows_pkey" PRIMARY KEY("follower_username","following_username")
);
--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_username_users_username_fk" FOREIGN KEY ("follower_username") REFERENCES "public"."users"("username") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_following_username_users_username_fk" FOREIGN KEY ("following_username") REFERENCES "public"."users"("username") ON DELETE cascade ON UPDATE cascade;