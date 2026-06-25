import { describe, it, expect, vi } from "vitest";
import { computeBadges, followUser, unfollowUser, isFollowing } from "./users";
import { ApiError } from "../lib/errors";

function makeMockDb(statsResult: unknown) {
  const chain = {
    select: vi.fn(() => chain),
    from: vi.fn(() => chain),
    where: vi.fn(() => chain),
    limit: vi.fn(() => Promise.resolve(statsResult ? [statsResult] : [])),
    orderBy: vi.fn(() => chain),
    offset: vi.fn(() => chain),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        onConflictDoNothing: vi.fn(() => Promise.resolve()),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
    })),
  };
  return chain;
}

describe("computeBadges", () => {
  it("awards first_post when posted >= 1", async () => {
    const db = makeMockDb({ posted: 1, answered: 0, maxPostUpvotes: 0, acceptedAnswers: 0, totalUpvotesReceived: 0 });
    const badges = await computeBadges(db as any, "alice");
    expect(badges.find((b) => b.id === "first_post")?.earned).toBe(true);
    expect(badges.find((b) => b.id === "energized")?.earned).toBe(false);
  });

  it("awards energized when answered >= 1", async () => {
    const db = makeMockDb({ posted: 0, answered: 1, maxPostUpvotes: 0, acceptedAnswers: 0, totalUpvotesReceived: 0 });
    const badges = await computeBadges(db as any, "alice");
    expect(badges.find((b) => b.id === "energized")?.earned).toBe(true);
  });

  it("awards helpful when acceptedAnswers >= 1", async () => {
    const db = makeMockDb({ posted: 0, answered: 0, maxPostUpvotes: 0, acceptedAnswers: 1, totalUpvotesReceived: 0 });
    const badges = await computeBadges(db as any, "alice");
    expect(badges.find((b) => b.id === "helpful")?.earned).toBe(true);
  });

  it("awards popular_question when maxPostUpvotes >= 10", async () => {
    const db = makeMockDb({ posted: 0, answered: 0, maxPostUpvotes: 10, acceptedAnswers: 0, totalUpvotesReceived: 0 });
    const badges = await computeBadges(db as any, "alice");
    expect(badges.find((b) => b.id === "popular_question")?.earned).toBe(true);
    expect(badges.find((b) => b.id === "rising_star")?.earned).toBe(false);
  });

  it("awards rising_star when maxPostUpvotes >= 25", async () => {
    const db = makeMockDb({ posted: 0, answered: 0, maxPostUpvotes: 25, acceptedAnswers: 0, totalUpvotesReceived: 0 });
    const badges = await computeBadges(db as any, "alice");
    expect(badges.find((b) => b.id === "rising_star")?.earned).toBe(true);
  });

  it("awards expert when acceptedAnswers >= 10", async () => {
    const db = makeMockDb({ posted: 0, answered: 0, maxPostUpvotes: 0, acceptedAnswers: 10, totalUpvotesReceived: 0 });
    const badges = await computeBadges(db as any, "alice");
    expect(badges.find((b) => b.id === "expert")?.earned).toBe(true);
  });

  it("awards century when totalUpvotesReceived >= 100", async () => {
    const db = makeMockDb({ posted: 0, answered: 0, maxPostUpvotes: 0, acceptedAnswers: 0, totalUpvotesReceived: 100 });
    const badges = await computeBadges(db as any, "alice");
    expect(badges.find((b) => b.id === "century")?.earned).toBe(true);
  });

  it("returns empty array when user not found", async () => {
    const db = makeMockDb(null);
    const badges = await computeBadges(db as any, "nonexistent");
    expect(badges).toEqual([]);
  });

  it("returns all badge definitions with earned status", async () => {
    const db = makeMockDb({ posted: 10, answered: 5, maxPostUpvotes: 50, acceptedAnswers: 15, totalUpvotesReceived: 200 });
    const badges = await computeBadges(db as any, "alice");
    expect(badges).toHaveLength(7);
    expect(badges.every((b) => b.earned)).toBe(true);
  });
});

describe("followUser", () => {
  it("throws when following yourself", async () => {
    await expect(followUser({} as any, "alice", "alice")).rejects.toThrow(ApiError);
  });

  it("throws when target user does not exist", async () => {
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      })),
    };
    await expect(followUser(db as any, "alice", "nonexistent")).rejects.toThrow("user not found");
  });

  it("inserts a follow relationship", async () => {
    let inserted = false;
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([{ username: "bob" }])),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        values: vi.fn(() => ({
          onConflictDoNothing: vi.fn(() => {
            inserted = true;
            return Promise.resolve();
          }),
        })),
      })),
    };
    const result = await followUser(db as any, "alice", "bob");
    expect(inserted).toBe(true);
    expect(result).toEqual({ message: "user followed" });
  });
});

describe("unfollowUser", () => {
  it("deletes the follow relationship", async () => {
    let deleted = false;
    const db = {
      delete: vi.fn(() => ({
        where: vi.fn(() => {
          deleted = true;
          return Promise.resolve();
        }),
      })),
    };
    const result = await unfollowUser(db as any, "alice", "bob");
    expect(deleted).toBe(true);
    expect(result).toEqual({ message: "user unfollowed" });
  });
});

describe("isFollowing", () => {
  it("returns false when follower is null or undefined", async () => {
    expect(await isFollowing({} as any, null, "bob")).toBe(false);
    expect(await isFollowing({} as any, undefined, "bob")).toBe(false);
  });

  it("returns true when follow relationship exists", async () => {
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([{ followingUsername: "bob" }])),
          })),
        })),
      })),
    };
    expect(await isFollowing(db as any, "alice", "bob")).toBe(true);
  });

  it("returns false when no follow relationship", async () => {
    const db = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(() => Promise.resolve([])),
          })),
        })),
      })),
    };
    expect(await isFollowing(db as any, "alice", "bob")).toBe(false);
  });
});
