import { describe, it, expect } from "vitest";
import { getMentionContext, applyMention, extractMentions } from "./mentions";

describe("getMentionContext", () => {
  it("returns context when cursor is after @username", () => {
    const ctx = getMentionContext("hello @al", 11);
    expect(ctx).toEqual({ query: "al", start: 6, end: 11 });
  });

  it("returns null when cursor is null", () => {
    expect(getMentionContext("hello @al", null)).toBeNull();
  });

  it("returns null when there is no @", () => {
    expect(getMentionContext("hello world", 5)).toBeNull();
  });

  it("returns null when @ is not preceded by whitespace or start", () => {
    expect(getMentionContext("test@alice", 9)).toBeNull();
  });

  it("returns null when there is whitespace after @", () => {
    expect(getMentionContext("hello @ alice", 7)).toBeNull();
  });

  it("returns null when @ is at cursor position with no query", () => {
    expect(getMentionContext("hello @", 7)).toBeNull();
  });

  it("returns null when fragment contains invalid characters", () => {
    expect(getMentionContext("hello @al!ce", 12)).toBeNull();
  });

  it("finds the last @ before cursor", () => {
    const ctx = getMentionContext("hey @bob check @ali", 20);
    expect(ctx?.query).toBe("ali");
    expect(ctx?.start).toBe(15);
  });

  it("allows hyphens in query", () => {
    const ctx = getMentionContext("hello @john-do", 15);
    expect(ctx).toEqual({ query: "john-do", start: 6, end: 15 });
  });
});

describe("applyMention", () => {
  it("replaces the mention query with full username", () => {
    const ctx = { query: "al", start: 6, end: 11 };
    const result = applyMention("hello @al", ctx, "alice");
    expect(result.value).toBe("hello @alice ");
    expect(result.cursor).toBe("hello @alice ".length);
  });

  it("inserts mention in the middle of text", () => {
    // "start @j end" -> @ at 6, cursor after j at 8
    const ctx = { query: "j", start: 6, end: 8 };
    const result = applyMention("start @j end", ctx, "john");
    expect(result.value).toBe("start @john  end");
    expect(result.cursor).toBe("start @john ".length);
  });
});

describe("extractMentions", () => {
  it("extracts unique usernames from content", () => {
    expect(extractMentions("hello @alice and @bob")).toEqual(["alice", "bob"]);
  });

  it("returns empty array when no mentions", () => {
    expect(extractMentions("hello world")).toEqual([]);
  });

  it("deduplicates usernames", () => {
    expect(extractMentions("@alice hi @alice")).toEqual(["alice"]);
  });

  it("handles underscores", () => {
    expect(extractMentions("hello @alice_smith")).toEqual(["alice_smith"]);
  });

  it("handles hyphens", () => {
    expect(extractMentions("hello @john-doe")).toEqual(["john-doe"]);
  });
});
