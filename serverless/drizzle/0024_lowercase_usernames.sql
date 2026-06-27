-- Drop auto-generated FK constraints on poll_votes that lack ON UPDATE CASCADE
ALTER TABLE "poll_votes" DROP CONSTRAINT IF EXISTS "poll_votes_username_fkey";
ALTER TABLE "poll_votes" DROP CONSTRAINT IF EXISTS "poll_votes_username_users_username_fk";
ALTER TABLE "poll_votes" DROP CONSTRAINT IF EXISTS "poll_votes_poll_uid_fkey";

-- Recreate poll_votes.username FK with ON UPDATE CASCADE so username changes propagate
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_username_users_username_fk" FOREIGN KEY ("username") REFERENCES "public"."users"("username") ON DELETE cascade ON UPDATE cascade;

-- Resolve case-conflicting usernames by appending a suffix
UPDATE "users" SET "username" = 'drv4ever1' WHERE "username" = 'Drv4ever';
UPDATE "users" SET "username" = 'spikeypear1' WHERE "username" = 'SpikeyPear';

-- Lowercase all existing usernames (ON UPDATE CASCADE propagates to child tables)
UPDATE "users" SET "username" = LOWER("username");
