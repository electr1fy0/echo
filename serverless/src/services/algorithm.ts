import { sql } from "drizzle-orm";
import { schema } from "../db";

/**
 * Algorithmic feed score expression for Drizzle queries.
 *
 * Score = engagement + recency + personalization + health
 *
 * Engagement: upvotes * 1 + replies * 2 + authorReputation * 0.01
 * Recency:    100 / (1 + hoursSinceCreation^1.5)   — power-law decay
 * Personalization: +15 for joined chamber, +10 for followed author
 * Health: +5 if accepted answer, +3 if avg reply length > 80 chars
 *
 * For logged-out users (currentUser is null/empty), personalization = 0,
 * giving a pure engagement + recency "cold start" feed.
 */
export const algorithmScore = (currentUser: string | undefined | null) => {
  const hoursAge = sql<number>`greatest(extract(epoch from (now() - ${schema.posts.timeCreated})) / 3600.0, 0.01)`;

  const engagement = sql<number>`
    (coalesce(${schema.posts.upvotesCount}, 0) * 1.0)
    + ((select count(*)::int from replies r where r.post_uid = ${schema.posts.uid}) * 2.0)
    + (coalesce(${schema.users.reputation}, 0) * 0.01)
  `;

  const recency = sql<number>`100.0 / (1.0 + power(${hoursAge}, 1.5))`;

  const personalization = sql<number>`
    (case when exists (
      select 1 from ${schema.chamberMembers} cm
      where cm.chamber_uid = ${schema.posts.chamberUid}
        and cm.username = ${currentUser || ""}
    ) then 15.0 else 0.0 end)
    + (case when exists (
      select 1 from ${schema.follows} f
      where f.follower_username = ${currentUser || ""}
        and f.following_username = ${schema.posts.author}
    ) then 10.0 else 0.0 end)
  `;

  const health = sql<number>`
    (case when ${schema.posts.acceptedAnswerUid} is not null then 5.0 else 0.0 end)
    + (case when (
      select coalesce(avg(length(r.content)), 0)
      from ${schema.replies} r
      where r.post_uid = ${schema.posts.uid}
    ) > 80 then 3.0 else 0.0 end)
  `;

  return sql<number>`(${engagement} + ${recency} + ${personalization} + ${health})`;
};
