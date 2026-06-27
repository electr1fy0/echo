import type { DB } from "../../db";
import type { PostTypeHandler } from "./handler";
import { schema } from "../../db";

export const pollHandler: PostTypeHandler = {
  type: "poll",
  getCreateValues(body) {
    return {
      postType: "poll",
      acceptsAnswers: false,
    };
  },
  getUpdateValues() {
    return {};
  },
  getMetadata(row: Record<string, unknown>) {
    const pollExpiresAt = row.pollExpiresAt;
    return {
      pollUid: row.pollUid ?? undefined,
      pollQuestion: row.pollQuestion ?? undefined,
      pollOptions: row.pollOptions ?? undefined,
      pollExpiresAt: pollExpiresAt instanceof Date ? pollExpiresAt.toISOString() : (pollExpiresAt ?? null),
      pollIsClosed: row.pollIsClosed ?? false,
      pollVotes: row.pollVotes ?? [],
      userPollVote: row.userPollVote ?? null,
    };
  },
  async afterCreate(db, postUid, body) {
    if (body.pollQuestion && body.pollOptions && Array.isArray(body.pollOptions) && body.pollOptions.length >= 2) {
      const expiresAt = body.ttlHours && Number(body.ttlHours) > 0
        ? new Date(Date.now() + Number(body.ttlHours) * 60 * 60 * 1000)
        : null;
      await db.insert(schema.polls).values({
        postUid,
        question: body.pollQuestion as string,
        options: body.pollOptions as string[],
        expiresAt,
      });
    }
  },
};
