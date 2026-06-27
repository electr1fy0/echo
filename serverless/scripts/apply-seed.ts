import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const sql = neon(databaseUrl);

async function main() {
  console.log("Ensuring TurnsOut team user exists...");

  await sql`
    INSERT INTO users (username, email, password, bio, is_verified, badges)
    VALUES ('turnsout', 'team@turnsout.xyz', NULL, 'The TurnsOut Team', true, '["verified"]')
    ON CONFLICT (username) DO UPDATE SET
      badges = CASE
        WHEN users.badges IS NULL OR NOT (users.badges::jsonb ? 'verified')
        THEN (COALESCE(users.badges::jsonb, '[]'::jsonb) || '"verified"'::jsonb)::text
        ELSE users.badges
      END,
      is_verified = true
  `;

  const [user] = await sql`
    SELECT username, email, is_verified, badges FROM users WHERE username = 'turnsout'
  `;
  console.log("TurnsOut user:", JSON.stringify(user, null, 2));
  console.log("Seed completed successfully");
}

main().catch((err) => {
  console.error("Failed to apply seed:", err);
  process.exit(1);
});
