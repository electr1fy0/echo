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

  it("double-clicking the same option restores a consistent no-vote state", () => {
    const initial = pollItem([{ optionIndex: 0, count: 7 }]);
    const voted = applyOptimisticPollVote(initial, 1);
    const unvoted = applyOptimisticPollVote(voted, 1);

    expect(unvoted.question.userPollVote).toBeNull();
    expect(unvoted.question.pollVotes).toEqual([{ optionIndex: 0, count: 7 }]);
  });

  it("preserves sorted unique non-negative counts across every 4-click sequence", () => {
    const options = [0, 1, 2];
    const sequences: number[][] = [];
    for (const a of options) for (const b of options) for (const c of options) for (const d of options) {
      sequences.push([a, b, c, d]);
    }

    for (const sequence of sequences) {
      let state = pollItem([
        { optionIndex: 0, count: 2 },
        { optionIndex: 2, count: 3 },
      ]);

      for (const option of sequence) {
        state = applyOptimisticPollVote(state, option);
        const votes = state.question.pollVotes ?? [];
        expect(votes.every((vote) => vote.count > 0)).toBe(true);
        expect(new Set(votes.map((vote) => vote.optionIndex)).size).toBe(votes.length);
        expect(votes.map((vote) => vote.optionIndex)).toEqual(
          [...votes.map((vote) => vote.optionIndex)].sort((a, b) => a - b),
        );
        const currentVote = state.question.userPollVote ?? null;
        expect(currentVote === null || options.includes(currentVote)).toBe(true);
      }
    }
  });
});