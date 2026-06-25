ALTER TABLE "posts" ADD COLUMN "is_anonymous" boolean DEFAULT false NOT NULL;
ALTER TABLE "replies" ADD COLUMN "is_anonymous" boolean DEFAULT false NOT NULL;
ALTER TABLE "notifications" ADD COLUMN "actor_is_anonymous" boolean DEFAULT false NOT NULL;
