ALTER TABLE "chambers" ADD COLUMN "search_vector" "tsvector";--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "search_vector" "tsvector";--> statement-breakpoint
ALTER TABLE "replies" ADD COLUMN "search_vector" "tsvector";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "search_vector" "tsvector";
--> statement-breakpoint

-- Backfill reputation for existing users
UPDATE "users" SET reputation = (
  coalesce((select sum(p."upvotes_count") from "posts" p where p.author = users.username), 0) * 10
  + coalesce((select sum(r."upvotes_count") from "replies" r where r.author = users.username), 0) * 15
  + (select count(*)::int from "posts" p2 where p2.author = users.username) * 5
  + (select count(*)::int from "replies" r2 where r2.author = users.username) * 5
  + coalesce((
    select count(*)::int from "replies" r3
    where r3.author = users.username
      and exists (select 1 from "posts" p3 where p3."accepted_answer_uid" = r3.uid)
  ), 0) * 50
);
--> statement-breakpoint

-- Create GIN indexes for full-text search
CREATE INDEX IF NOT EXISTS posts_search_idx ON "posts" USING GIN("search_vector");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS replies_search_idx ON "replies" USING GIN("search_vector");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS chambers_search_idx ON "chambers" USING GIN("search_vector");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS users_search_idx ON "users" USING GIN("search_vector");
--> statement-breakpoint

-- Backfill search vectors
UPDATE "posts" SET search_vector = to_tsvector('english', coalesce(content, ''));
--> statement-breakpoint
UPDATE "replies" SET search_vector = to_tsvector('english', coalesce(content, ''));
--> statement-breakpoint
UPDATE "chambers" SET search_vector = to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''));
--> statement-breakpoint
UPDATE "users" SET search_vector = to_tsvector('english', coalesce(username, ''));
--> statement-breakpoint

-- Create trigger function to keep search vectors updated
CREATE OR REPLACE FUNCTION update_post_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION update_reply_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.content, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION update_chamber_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.name, '') || ' ' || coalesce(NEW.description, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION update_user_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', coalesce(NEW.username, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

-- Attach triggers
DROP TRIGGER IF EXISTS trg_post_search_vector ON "posts";
CREATE TRIGGER trg_post_search_vector
  BEFORE INSERT OR UPDATE OF content ON "posts"
  FOR EACH ROW EXECUTE FUNCTION update_post_search_vector();
--> statement-breakpoint
DROP TRIGGER IF EXISTS trg_reply_search_vector ON "replies";
CREATE TRIGGER trg_reply_search_vector
  BEFORE INSERT OR UPDATE OF content ON "replies"
  FOR EACH ROW EXECUTE FUNCTION update_reply_search_vector();
--> statement-breakpoint
DROP TRIGGER IF EXISTS trg_chamber_search_vector ON "chambers";
CREATE TRIGGER trg_chamber_search_vector
  BEFORE INSERT OR UPDATE OF name, description ON "chambers"
  FOR EACH ROW EXECUTE FUNCTION update_chamber_search_vector();
--> statement-breakpoint
DROP TRIGGER IF EXISTS trg_user_search_vector ON "users";
CREATE TRIGGER trg_user_search_vector
  BEFORE INSERT OR UPDATE OF username ON "users"
  FOR EACH ROW EXECUTE FUNCTION update_user_search_vector();