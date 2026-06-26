ALTER TABLE "chambers" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "accepts_answers" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "chambers" ADD CONSTRAINT "chambers_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_slug_unique" UNIQUE("slug");