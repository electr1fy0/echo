import { describe, expect, it } from "vitest";
import { messagePreview, normalizeConversationParticipants, parseSinceDate } from "./dms";

describe("DM service invariants", () => {
  it("normalizes participant ordering deterministically", () => {
    expect(normalizeConversationParticipants("alice", "bob")).toEqual(["alice", "bob"]);
    expect(normalizeConversationParticipants("bob", "alice")).toEqual(["alice", "bob"]);
    expect(normalizeConversationParticipants("Alice", "alice")).toEqual(["Alice", "alice"]);
  });

  it("returns undefined when no since cursor is supplied", () => {
    expect(parseSinceDate()).toBeUndefined();
    expect(parseSinceDate("")).toBeUndefined();
  });

  it("parses valid ISO timestamps", () => {
    const parsed = parseSinceDate("2026-08-20T12:34:56.000Z");
    expect(parsed?.toISOString()).toBe("2026-08-20T12:34:56.000Z");
  });

  it("rejects malformed timestamps instead of passing Invalid Date to the DB", () => {
    expect(() => parseSinceDate("not-a-date")).toThrow("invalid since timestamp");
    expect(() => parseSinceDate("2026-99-99")).toThrow("invalid since timestamp");
  });

  it("keeps short message previews unchanged", () => {
    expect(messagePreview("hello")).toBe("hello");
  });

  it("truncates previews at exactly 100 characters without mutating content", () => {
    const content = "x".repeat(150);
    expect(messagePreview(content)).toHaveLength(100);
    expect(messagePreview(content)).toBe("x".repeat(100));
    expect(content).toHaveLength(150);
  });
});
