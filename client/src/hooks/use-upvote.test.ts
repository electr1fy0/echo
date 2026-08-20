import { describe, expect, it } from "vitest";
import type { AnswerItem, QuestionItem } from "@/types";
import { toggleQuestionItem, toggleReplyItem } from "./use-upvote";

function questionItem(isUpvoted: boolean, upvotes: number): QuestionItem {
  return {
    question: {
      uid: "post-1",
      content: "post",
      authorUsername: "alice",
      isUpvoted,
      upvotes,
    },
    author: {} as QuestionItem["author"],
  };
}

function replyItem(isUpvoted: boolean, upvotes: number): AnswerItem {
  return {
    answer: {
      uid: "reply-1",
      content: "reply",
      questionUid: "post-1",
      authorUsername: "alice",
      isUpvoted,
      upvotes,
    },
    author: {} as AnswerItem["author"],
  };
}

describe("optimistic vote reducers", () => {
  it("never makes a post vote count negative", () => {
    const result = toggleQuestionItem(questionItem(true, 0));
    expect(result.question.upvotes).toBe(0);
    expect(result.question.isUpvoted).toBe(false);
  });

  it("never makes a reply vote count negative", () => {
    const result = toggleReplyItem(replyItem(true, 0));
    expect(result.answer.upvotes).toBe(0);
    expect(result.answer.isUpvoted).toBe(false);
  });

  it("is its own inverse for a consistent post state", () => {
    const initial = questionItem(false, 7);
    expect(toggleQuestionItem(toggleQuestionItem(initial))).toEqual(initial);
  });

  it("supports composable rollback when overlapping toggles resolve differently", () => {
    const initial = questionItem(false, 10);
    const afterFirstOptimistic = toggleQuestionItem(initial);
    const afterSecondOptimistic = toggleQuestionItem(afterFirstOptimistic);

    const afterFirstRequestFails = toggleQuestionItem(afterSecondOptimistic);

    expect(afterFirstRequestFails.question.isUpvoted).toBe(true);
    expect(afterFirstRequestFails.question.upvotes).toBe(11);
  });
});
