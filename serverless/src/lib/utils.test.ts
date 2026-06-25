import { describe, it, expect } from "vitest";
import {
  countWords,
  parsePagination,
  randomToken,
  extractMentions,
  ensureValidUsername,
  requireEnv,
  normalizeUsername,
} from "./utils";

describe("countWords", () => {
  it("counts words in a normal sentence", () => {
    expect(countWords("hello world")).toBe(2);
  });

  it("returns 0 for empty string", () => {
    expect(countWords("")).toBe(0);
  });

  it("returns 0 for whitespace-only string", () => {
    expect(countWords("   ")).toBe(0);
  });

  it("handles multiple spaces between words", () => {
    expect(countWords("hello   world   test")).toBe(3);
  });

  it("counts a single word", () => {
    expect(countWords("hello")).toBe(1);
  });
});

describe("parsePagination", () => {
  it("parses valid limit and offset", () => {
    expect(parsePagination({ limit: "10", offset: "5" })).toEqual({
      limit: 10,
      offset: 5,
    });
  });

  it("uses defaults when no params provided", () => {
    expect(parsePagination({})).toEqual({ limit: 500, offset: 0 });
  });

  it("falls back to defaults for NaN values", () => {
    expect(parsePagination({ limit: "abc", offset: "xyz" })).toEqual({
      limit: 500,
      offset: 0,
    });
  });

  it("handles partial params", () => {
    expect(parsePagination({ limit: "20" })).toEqual({ limit: 20, offset: 0 });
    expect(parsePagination({ offset: "10" })).toEqual({ limit: 500, offset: 10 });
  });
});

describe("randomToken", () => {
  it("generates a hex string of the expected length", () => {
    const token = randomToken(16);
    expect(token).toHaveLength(32);
    expect(/^[0-9a-f]+$/.test(token)).toBe(true);
  });

  it("generates different tokens on each call", () => {
    const a = randomToken(16);
    const b = randomToken(16);
    expect(a).not.toBe(b);
  });

  it("handles different byte lengths", () => {
    expect(randomToken(1)).toHaveLength(2);
    expect(randomToken(4)).toHaveLength(8);
    expect(randomToken(32)).toHaveLength(64);
  });
});

describe("extractMentions", () => {
  it("extracts usernames prefixed with @", () => {
    expect(extractMentions("hello @alice and @bob")).toEqual(["alice", "bob"]);
  });

  it("returns empty array when no mentions exist", () => {
    expect(extractMentions("hello world")).toEqual([]);
  });

  it("deduplicates repeated mentions", () => {
    expect(extractMentions("@alice hey @alice again")).toEqual(["alice"]);
  });

  it("handles underscores in usernames", () => {
    expect(extractMentions("hello @alice_smith")).toEqual(["alice_smith"]);
  });

  it("returns empty for empty string", () => {
    expect(extractMentions("")).toEqual([]);
  });
});

describe("ensureValidUsername", () => {
  it("accepts valid usernames", () => {
    expect(() => ensureValidUsername("alice")).not.toThrow();
    expect(() => ensureValidUsername("alice_123")).not.toThrow();
    expect(() => ensureValidUsername("a-b_c")).not.toThrow();
    expect(() => ensureValidUsername("a".repeat(20))).not.toThrow();
  });

  it("throws when username is empty", () => {
    expect(() => ensureValidUsername("")).toThrow("username is required");
  });

  it("throws when username is too short", () => {
    expect(() => ensureValidUsername("ab")).toThrow(
      "username must be between 3 and 20 characters",
    );
  });

  it("throws when username is too long", () => {
    expect(() => ensureValidUsername("a".repeat(21))).toThrow(
      "username must be between 3 and 20 characters",
    );
  });

  it("throws when username starts with a number", () => {
    expect(() => ensureValidUsername("1alice")).toThrow(
      "username must start with a letter",
    );
  });

  it("throws when username contains special characters", () => {
    expect(() => ensureValidUsername("alice!@#")).toThrow(
      "username must start with a letter",
    );
  });
});

describe("requireEnv", () => {
  it("returns the value when provided", () => {
    expect(requireEnv("my-secret", "SECRET_KEY")).toBe("my-secret");
  });

  it("throws when value is undefined", () => {
    expect(() => requireEnv(undefined, "SECRET_KEY")).toThrow(
      "SECRET_KEY is required",
    );
  });

  it("throws when value is empty string", () => {
    expect(() => requireEnv("", "SECRET_KEY")).toThrow(
      "SECRET_KEY is required",
    );
  });
});

describe("normalizeUsername", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeUsername("  alice  ")).toBe("alice");
  });

  it("does not modify already trimmed usernames", () => {
    expect(normalizeUsername("alice")).toBe("alice");
  });
});
