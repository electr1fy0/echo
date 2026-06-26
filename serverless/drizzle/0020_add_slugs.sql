-- Add slug columns (nullable initially for backfill)
ALTER TABLE "chambers" ADD COLUMN "slug" text;
ALTER TABLE "posts" ADD COLUMN "slug" text;

-- Backfill chamber slugs from name
UPDATE "chambers"
SET "slug" = lower(trim(regexp_replace("name", '[^a-zA-Z0-9\s-]', '', 'g')))
WHERE "slug" IS NULL;

UPDATE "chambers"
SET "slug" = regexp_replace(trim("slug"), '\s+', '-', 'g')
WHERE "slug" IS NOT NULL;

UPDATE "chambers" SET "slug" = 'untitled' WHERE "slug" IS NULL OR "slug" = '';

-- Deduplicate chamber slugs
UPDATE "chambers" c
SET "slug" = c."slug" || '-' || s.seq
FROM (
  SELECT "uid", row_number() OVER (PARTITION BY "slug" ORDER BY "created_at") - 1 AS seq
  FROM "chambers"
) s
WHERE c."uid" = s."uid" AND s.seq > 0;

-- Backfill post slugs from content
UPDATE "posts"
SET "slug" = lower(trim(regexp_replace(regexp_replace(COALESCE("content", ''), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')))
WHERE "slug" IS NULL;

UPDATE "posts" SET "slug" = substring("slug", 1, 80);
UPDATE "posts" SET "slug" = 'post-' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 8) WHERE "slug" IS NULL OR "slug" = '';

-- Deduplicate post slugs
UPDATE "posts" p
SET "slug" = p."slug" || '-' || s.seq
FROM (
  SELECT "uid", row_number() OVER (PARTITION BY "slug" ORDER BY "time_created") - 1 AS seq
  FROM "posts"
) s
WHERE p."uid" = s."uid" AND s.seq > 0;

-- Make slug NOT NULL and UNIQUE
ALTER TABLE "chambers" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "chambers" ADD CONSTRAINT "chambers_slug_unique" UNIQUE ("slug");
ALTER TABLE "posts" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "posts" ADD CONSTRAINT "posts_slug_unique" UNIQUE ("slug");
