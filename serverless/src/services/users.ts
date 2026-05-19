import { eq, sql } from "drizzle-orm";

import type { DB } from "../db";
import { schema } from "../db";
import { ApiError } from "../lib/errors";

const profileSelect = {
  username: schema.users.username,
  email: schema.users.email,
  bio: sql<string>`coalesce(${schema.users.bio}, '')`,
  avatar: sql<string>`coalesce(${schema.users.avatar}, '')`,
  link: sql<string>`coalesce(${schema.users.links}, '')`,
  posted: sql<number>`(
    select count(*)::int from ${schema.questions}
    where ${schema.questions.author} = ${schema.users.username}
  )`,
  answered: sql<number>`(
    select count(*)::int from ${schema.answers}
    where ${schema.answers.author} = ${schema.users.username}
  )`,
};

export const getProfileByUsername = async (db: DB, username: string, includeEmail: boolean) => {
  const [profile] = await db
    .select(profileSelect)
    .from(schema.users)
    .where(eq(schema.users.username, username))
    .limit(1);

  if (!profile) {
    throw new ApiError(404, "profile not found");
  }

  return includeEmail
    ? profile
    : {
        username: profile.username,
        bio: profile.bio,
        avatar: profile.avatar,
        link: profile.link,
        posted: profile.posted,
        answered: profile.answered,
      };
};
