-- Seed: Ensure TurnsOut team user exists with verified badge
INSERT INTO users (username, email, password, bio, is_verified, badges)
VALUES ('turnsout', 'team@turnsout.xyz', NULL, 'The TurnsOut Team', true, '["verified"]')
ON CONFLICT (username) DO UPDATE SET
  badges = CASE
    WHEN users.badges IS NULL OR NOT (users.badges::jsonb ? 'verified')
    THEN (COALESCE(users.badges::jsonb, '[]'::jsonb) || '"verified"'::jsonb)::text
    ELSE users.badges
  END,
  is_verified = true;
