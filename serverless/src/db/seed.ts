import { eq } from "drizzle-orm";
import type { DB } from ".";
import { schema } from "../db";

const TURNSOUT_USERNAME = "turnsout";
const TURNSOUT_EMAIL = "team@turnsout.xyz";

export const ensureTurnsOutUser = async (db: DB) => {
  const [existing] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.username, TURNSOUT_USERNAME))
    .limit(1);

  if (existing) {
    const badges = (existing.badges as string[]) ?? [];
    if (!badges.includes("verified")) {
      await db
        .update(schema.users)
        .set({ badges: [...badges, "verified"], isVerified: true })
        .where(eq(schema.users.username, TURNSOUT_USERNAME));
    }
    if (!existing.isVerified) {
      await db
        .update(schema.users)
        .set({ isVerified: true })
        .where(eq(schema.users.username, TURNSOUT_USERNAME));
    }
    return existing;
  }

  const [created] = await db
    .insert(schema.users)
    .values({
      username: TURNSOUT_USERNAME,
      email: TURNSOUT_EMAIL,
      password: null,
      bio: "The TurnsOut Team",
      isVerified: true,
      badges: ["verified"],
    })
    .returning();

  return created;
};

export { TURNSOUT_USERNAME, TURNSOUT_EMAIL };
