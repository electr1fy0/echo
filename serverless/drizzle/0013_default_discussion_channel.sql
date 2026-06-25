--> statement-breakpoint
INSERT INTO channels (chamber_uid, name, icon, schema)
SELECT c.uid, 'discussion', 'message-square', '[]'::json
FROM chambers c
WHERE NOT EXISTS (
  SELECT 1 FROM channels ch
  WHERE ch.chamber_uid = c.uid
  AND (ch.name = 'discussion' OR ch.name = 'discussions')
);
