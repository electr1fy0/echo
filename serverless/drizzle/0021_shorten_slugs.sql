-- Trim existing posts slugs to 40 chars and deduplicate
UPDATE "posts" SET "slug" = substring("slug", 1, 40);
UPDATE "posts" SET "slug" = 'post-' || substring(replace(gen_random_uuid()::text, '-', ''), 1, 8) WHERE "slug" = '' OR "slug" = '-';

UPDATE "posts" p
SET "slug" = p."slug" || '-' || s.seq
FROM (
  SELECT "uid", row_number() OVER (PARTITION BY "slug" ORDER BY "time_created") - 1 AS seq
  FROM "posts"
) s
WHERE p."uid" = s."uid" AND s.seq > 0;
UPDATE "posts" SET "slug" = regexp_replace("slug", '-+$', '') WHERE "slug" LIKE '%-';

-- Trim existing chambers slugs to 40 chars and deduplicate
UPDATE "chambers" SET "slug" = substring("slug", 1, 40);
UPDATE "chambers" SET "slug" = 'untitled' WHERE "slug" = '' OR "slug" = '-';

UPDATE "chambers" c
SET "slug" = c."slug" || '-' || s.seq
FROM (
  SELECT "uid", row_number() OVER (PARTITION BY "slug" ORDER BY "created_at") - 1 AS seq
  FROM "chambers"
) s
WHERE c."uid" = s."uid" AND s.seq > 0;
UPDATE "chambers" SET "slug" = regexp_replace("slug", '-+$', '') WHERE "slug" LIKE '%-';
