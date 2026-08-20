import { describe, expect, it } from "vitest";
import type { Message } from "@/types";
import { reconcileSentMessage, removeOptimisticMessage } from "./use-dms";

function message(uid: string, content: string, timeCreated: string): Message {
  return {
    uid,
    conversationUid: "conv-1",
    sender: "alice",
    content,
    timeCreated,
  };
}

describe("optimistic DM reconciliation", () => {
  it("replaces only the optimistic message belonging to the completed send", () => {
    const messages = [
      message("server-old", "old", "2026-08-20T08:00:00.000Z"),
      message("optimistic-a", "first", "2026-08-20T08:01:00.000Z"),
      message("optimistic-b", "second", "2026-08-20T08:02:00.000Z"),
    ];
    const saved = message("server-a", "first", "2026-08-20T08:01:30.000Z");

    const result = reconcileSentMessage(messages, "optimistic-a", saved);

    expect(result.map((item) => item.uid)).toEqual([
      "server-old",
      "server-a",
      "optimistic-b",
    ]);
  });

  it("does not remove a second in-flight send when responses complete out of order", () => {
    const messages = [
      message("optimistic-first", "first", "2026-08-20T08:01:00.000Z"),
      message("optimistic-second", "second", "2026-08-20T08:02:00.000Z"),
    ];
    const secondSaved = message("server-second", "second", "2026-08-20T08:02:30.000Z");

    const afterSecondCompletes = reconcileSentMessage(
      messages,
      "optimistic-second",
      secondSaved,
    );

    expect(afterSecondCompletes.map((item) => item.uid)).toContain("optimistic-first");
    expect(afterSecondCompletes.map((item) => item.uid)).toContain("server-second");
  });

  it("deduplicates a server message already merged by polling", () => {
    const saved = message("server-a", "hello", "2026-08-20T08:01:00.000Z");
    const result = reconcileSentMessage(
      [message("optimistic-a", "hello", "2026-08-20T08:00:30.000Z"), saved],
      "optimistic-a",
      saved,
    );

    expect(result.filter((item) => item.uid === "server-a")).toHaveLength(1);
  });

  it("removes only the failed optimistic send instead of restoring a stale snapshot", () => {
    const messages = [
      message("server-new", "already completed", "2026-08-20T08:03:00.000Z"),
      message("optimistic-failed", "failed", "2026-08-20T08:04:00.000Z"),
      message("optimistic-other", "still pending", "2026-08-20T08:05:00.000Z"),
    ];

    const result = removeOptimisticMessage(messages, "optimistic-failed");

    expect(result?.map((item) => item.uid)).toEqual([
      "server-new",
      "optimistic-other",
    ]);
  });
});
