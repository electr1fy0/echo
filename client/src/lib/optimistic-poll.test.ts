import { describe, expect, it } from "vitest";
import type { QuestionItem } from "@/types";
import { applyOptimisticPollVote } from "./optimistic-poll";

function pollItem(
  pollVotes: { optionIndex: number; count: number }[],
  userPollVote: number | null = null,
): QuestionItem {
  return {
    question: {
      uid: "post-1",
      content: "Pick one",
      authorUsername: "alice",
      upvotes: 0,
      isUpvoted: false,
      postType: "poll",
      pollOptions: ["A", "B", "C"],
      pollVotes,
      userPollVote,
    },
    author: {
      username: "alice",
      email: "alice@example.com",
      bio: "",
      avatar: "",
      reputation: 0,
      answered: 0,
      posted: 0,
    },
  };
}

describe("applyOptimisticPollVote", () => {
  it("creates a count row when voting for an option that currently has zero votes", () => {
    const result = applyOptimisticPollVote(pollItem([{ optionIndex: 0, count: 2 }]), 2);

    expect(result.question.pollVotes).toEqual([
      { optionIndex: 0, count: 2 },
      { optionIndex: 2, count: 1 },
    ]);
    expect(result.question.userPollVote).toBe(2);
  });

  it("removes the vote when the selected option is clicked again", () => {
    const result = applyOptimisticPollVote(
      pollItem([{ optionIndex: 1, count: 1 }], 1),
      1,
    );

    expect(result.question.pollVotes).toEqual([]);
    expect(result.question.userPollVote).toBeNull();
  });

  it("moves a vote between options and creates the destination row if needed", () => {
    const result = applyOptimisticPollVote(
      pollItem([{ optionIndex: 0, count: 1 }], 0),
      2,
    );

    expect(result.question.pollVotes).toEqual([{ optionIndex: 2, count: 1 }]);
    expect(result.question.userPollVote).toBe(2);
  });

  it("never produces negative counts", () => {
    const result = applyOptimisticPollVote(
      pollItem([{ optionIndex: 0, count: 0 }], 0),
      0,
    );

    expect(result.question.pollVotes).toEqual([]);
  });

  it("does not mutate non-poll posts", () => {
    const item = pollItem([]);
    item.question.postType = "qna";

    expect(applyOptimisticPollVote(item, 0)).toBe(item);
  });
});
