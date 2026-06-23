CREATE TABLE "channels" (
	"uid" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chamber_uid" uuid NOT NULL,
	"name" text NOT NULL,
	"icon" text,
	"schema" json DEFAULT '[]'::json NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "channel_uid" uuid;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "custom_fields" json DEFAULT '{}'::json;--> statement-breakpoint
ALTER TABLE "replies" ADD COLUMN "parent_reply_uid" uuid;--> statement-breakpoint
ALTER TABLE "channels" ADD CONSTRAINT "channels_chamber_uid_chambers_uid_fk" FOREIGN KEY ("chamber_uid") REFERENCES "public"."chambers"("uid") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_channel_uid_channels_uid_fk" FOREIGN KEY ("channel_uid") REFERENCES "public"."channels"("uid") ON DELETE cascade ON UPDATE no action;