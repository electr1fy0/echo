import { describe, expect, it } from "vitest";
import type { AnswerItem } from "@/types";
import { removeOptimisticReply } from "./use-replies";

function reply(uid: string): AnswerItem {
  return {
    answer: {
      uid,
      content: uid,
      questionUid: "post-1",
      authorUsername: "alice",
      upvotes: 0,
      isUpvoted: false,
    },
    author: {} as AnswerItem["author"],
  };
}

describe("optimistic reply creation", () => {
  it("removes only the failed optimistic reply", () => {
    const result = removeOptimisticReply(
      [reply("server-1"), reply("temp-failed"), reply("temp-other")],
      "temp-failed",
    );

    expect(result?.map((item) => item.answer.uid)).toEqual([
      "server-1",
      "temp-other",
    ]);
  });

  it("preserves server replies added after the optimistic mutation started", () => {
    const result = removeOptimisticReply(
      [reply("temp-failed"), reply("server-new")],
      "temp-failed",
    );

    expect(result?.map((item) => item.answer.uid)).toEqual(["server-new"]);
  });
});
