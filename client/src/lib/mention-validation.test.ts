import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveUsers } from "@/api/users";
import { validateMentions } from "./mention-validation";

vi.mock("@/api/users", () => ({
  resolveUsers: vi.fn(),
}));

const mockedResolveUsers = vi.mocked(resolveUsers);

beforeEach(() => {
  mockedResolveUsers.mockReset();
});

describe("validateMentions", () => {
  it("returns immediately when there are no mentions", async () => {
    await expect(validateMentions("plain text")).resolves.toEqual({ mentions: [], missing: [] });
    expect(mockedResolveUsers).not.toHaveBeenCalled();
  });

  it("deduplicates repeated usernames before resolving", async () => {
    mockedResolveUsers.mockResolvedValue(["alice"]);
    await expect(validateMentions("@alice hi @alice")).resolves.toEqual({
      mentions: ["alice"],
      missing: [],
    });
    expect(mockedResolveUsers).toHaveBeenCalledWith(["alice"]);
  });

  it("keeps mention order stable", async () => {
    mockedResolveUsers.mockResolvedValue(["carol", "alice", "bob"]);
    const result = await validateMentions("@carol @alice @bob @carol");
    expect(result.mentions).toEqual(["carol", "alice", "bob"]);
  });

  it("returns only usernames that could not be resolved", async () => {
    mockedResolveUsers.mockResolvedValue(["alice", "carol"]);
    await expect(validateMentions("@alice @bob @carol @dave")).resolves.toEqual({
      mentions: ["alice", "bob", "carol", "dave"],
      missing: ["bob", "dave"],
    });
  });

  it("reports every username as missing when none resolve", async () => {
    mockedResolveUsers.mockResolvedValue([]);
    await expect(validateMentions("@alice @bob")).resolves.toEqual({
      mentions: ["alice", "bob"],
      missing: ["alice", "bob"],
    });
  });

  it("treats resolver results as exact and case-sensitive", async () => {
    mockedResolveUsers.mockResolvedValue(["Alice"]);
    await expect(validateMentions("@alice")).resolves.toEqual({
      mentions: ["alice"],
      missing: ["alice"],
    });
  });

  it("supports underscores and hyphens in usernames", async () => {
    mockedResolveUsers.mockResolvedValue(["alice_dev", "bob-test"]);
    await expect(validateMentions("ping @alice_dev and @bob-test")).resolves.toEqual({
      mentions: ["alice_dev", "bob-test"],
      missing: [],
    });
  });

  it("bubbles resolver failures instead of silently accepting mentions", async () => {
    mockedResolveUsers.mockRejectedValue(new Error("network down"));
    await expect(validateMentions("@alice")).rejects.toThrow("network down");
  });
});
