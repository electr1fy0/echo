import { afterEach, describe, expect, it, vi } from "vitest";
import { partnerHandler } from "./partner";
import { pollHandler } from "./poll";
import { qnaHandler } from "./qna";
import { taxiHandler } from "./taxi";
import { tradeHandler } from "./trade";

const now = new Date("2026-08-20T12:00:00.000Z");

afterEach(() => {
  vi.useRealTimers();
});

describe("qnaHandler", () => {
  it("defaults acceptsAnswers to false", () => {
    expect(qnaHandler.getCreateValues({}, now)).toEqual({
      acceptsAnswers: false,
      postType: "qna",
    });
  });

  it("preserves acceptsAnswers=true", () => {
    expect(qnaHandler.getCreateValues({ acceptsAnswers: true }, now).acceptsAnswers).toBe(true);
  });

  it("preserves acceptsAnswers=false", () => {
    expect(qnaHandler.getCreateValues({ acceptsAnswers: false }, now).acceptsAnswers).toBe(false);
  });

  it("does not expose updateable qna-specific fields", () => {
    expect(qnaHandler.getUpdateValues({ acceptsAnswers: true })).toEqual({});
  });

  it("returns empty qna metadata", () => {
    expect(qnaHandler.getMetadata({ acceptsAnswers: true })).toEqual({});
  });
});

describe("partnerHandler", () => {
  it("fills optional create fields with null and opens the listing", () => {
    expect(partnerHandler.getCreateValues({}, now)).toEqual({
      postType: "partner",
      partnerTargetGrade: null,
      partnerWorkstyle: null,
      partnerSlotsNeeded: null,
      partnerStatus: "open",
      acceptsAnswers: false,
    });
  });

  it("preserves falsy-but-valid create values", () => {
    const values = partnerHandler.getCreateValues({
      partnerTargetGrade: "",
      partnerWorkstyle: "",
      partnerSlotsNeeded: 0,
    }, now);
    expect(values.partnerTargetGrade).toBe("");
    expect(values.partnerWorkstyle).toBe("");
    expect(values.partnerSlotsNeeded).toBe(0);
  });

  it("ignores undefined update fields", () => {
    expect(partnerHandler.getUpdateValues({ partnerSlotsNeeded: undefined })).toEqual({});
  });

  it("includes null, zero, and empty-string update values", () => {
    expect(partnerHandler.getUpdateValues({
      partnerSlotsNeeded: 0,
      partnerTargetGrade: null,
      partnerWorkstyle: "",
      partnerStatus: "closed",
    })).toEqual({
      partnerSlotsNeeded: 0,
      partnerTargetGrade: null,
      partnerWorkstyle: "",
      partnerStatus: "closed",
    });
  });

  it("does not copy unrelated update fields", () => {
    expect(partnerHandler.getUpdateValues({ title: "ignored", partnerStatus: "closed" })).toEqual({
      partnerStatus: "closed",
    });
  });

  it("normalizes missing metadata fields to null", () => {
    expect(partnerHandler.getMetadata({})).toEqual({
      partnerTargetGrade: null,
      partnerWorkstyle: null,
      partnerSlotsNeeded: null,
      partnerStatus: null,
    });
  });

  it("preserves falsy metadata values", () => {
    expect(partnerHandler.getMetadata({
      partnerTargetGrade: "",
      partnerWorkstyle: "",
      partnerSlotsNeeded: 0,
      partnerStatus: "open",
    })).toEqual({
      partnerTargetGrade: "",
      partnerWorkstyle: "",
      partnerSlotsNeeded: 0,
      partnerStatus: "open",
    });
  });
});

describe("tradeHandler", () => {
  it("fills optional create fields with null and marks the listing available", () => {
    expect(tradeHandler.getCreateValues({}, now)).toEqual({
      postType: "trade",
      tradePrice: null,
      tradeCondition: null,
      tradeBookIsbn: null,
      tradeStatus: "available",
      acceptsAnswers: false,
    });
  });

  it("preserves a zero price and empty strings on create", () => {
    const values = tradeHandler.getCreateValues({
      tradePrice: 0,
      tradeCondition: "",
      tradeBookIsbn: "",
    }, now);
    expect(values.tradePrice).toBe(0);
    expect(values.tradeCondition).toBe("");
    expect(values.tradeBookIsbn).toBe("");
  });

  it("ignores undefined trade updates", () => {
    expect(tradeHandler.getUpdateValues({ tradePrice: undefined, tradeStatus: undefined })).toEqual({});
  });

  it("includes explicit clearing and zero values in updates", () => {
    expect(tradeHandler.getUpdateValues({
      tradePrice: 0,
      tradeCondition: null,
      tradeBookIsbn: "",
      tradeStatus: "sold",
    })).toEqual({
      tradePrice: 0,
      tradeCondition: null,
      tradeBookIsbn: "",
      tradeStatus: "sold",
    });
  });

  it("drops unrelated trade update fields", () => {
    expect(tradeHandler.getUpdateValues({ content: "ignored", tradeStatus: "sold" })).toEqual({
      tradeStatus: "sold",
    });
  });

  it("normalizes absent trade metadata to null", () => {
    expect(tradeHandler.getMetadata({})).toEqual({
      tradePrice: null,
      tradeCondition: null,
      tradeBookIsbn: null,
      tradeStatus: null,
    });
  });

  it("preserves zero and empty-string trade metadata", () => {
    expect(tradeHandler.getMetadata({
      tradePrice: 0,
      tradeCondition: "",
      tradeBookIsbn: "",
      tradeStatus: "available",
    })).toEqual({
      tradePrice: 0,
      tradeCondition: "",
      tradeBookIsbn: "",
      tradeStatus: "available",
    });
  });
});

describe("taxiHandler", () => {
  it("fills optional create fields with null and opens the ride", () => {
    expect(taxiHandler.getCreateValues({}, now)).toEqual({
      postType: "taxi",
      taxiDeparture: null,
      taxiDestination: null,
      taxiDatetime: null,
      taxiSeatsAvailable: null,
      taxiStatus: "open",
      acceptsAnswers: false,
    });
  });

  it("preserves zero seats and empty strings on create", () => {
    const values = taxiHandler.getCreateValues({
      taxiDeparture: "",
      taxiDestination: "",
      taxiDatetime: "",
      taxiSeatsAvailable: 0,
    }, now);
    expect(values.taxiDeparture).toBe("");
    expect(values.taxiDestination).toBe("");
    expect(values.taxiDatetime).toBe("");
    expect(values.taxiSeatsAvailable).toBe(0);
  });

  it("ignores undefined taxi updates", () => {
    expect(taxiHandler.getUpdateValues({ taxiSeatsAvailable: undefined, taxiStatus: undefined })).toEqual({});
  });

  it("includes explicit clearing and zero values in taxi updates", () => {
    expect(taxiHandler.getUpdateValues({
      taxiDeparture: null,
      taxiDestination: "",
      taxiDatetime: null,
      taxiSeatsAvailable: 0,
      taxiStatus: "full",
    })).toEqual({
      taxiDeparture: null,
      taxiDestination: "",
      taxiDatetime: null,
      taxiSeatsAvailable: 0,
      taxiStatus: "full",
    });
  });

  it("drops unrelated taxi update fields", () => {
    expect(taxiHandler.getUpdateValues({ author: "ignored", taxiStatus: "cancelled" })).toEqual({
      taxiStatus: "cancelled",
    });
  });

  it("normalizes absent taxi metadata to null", () => {
    expect(taxiHandler.getMetadata({})).toEqual({
      taxiDeparture: null,
      taxiDestination: null,
      taxiDatetime: null,
      taxiSeatsAvailable: null,
      taxiStatus: null,
    });
  });

  it("preserves zero and empty-string taxi metadata", () => {
    expect(taxiHandler.getMetadata({
      taxiDeparture: "",
      taxiDestination: "",
      taxiDatetime: "",
      taxiSeatsAvailable: 0,
      taxiStatus: "open",
    })).toEqual({
      taxiDeparture: "",
      taxiDestination: "",
      taxiDatetime: "",
      taxiSeatsAvailable: 0,
      taxiStatus: "open",
    });
  });
});

describe("pollHandler", () => {
  const pollDb = () => {
    const values = vi.fn().mockResolvedValue(undefined);
    const insert = vi.fn(() => ({ values }));
    return { db: { insert } as any, insert, values };
  };

  it("always creates a poll post without answers", () => {
    expect(pollHandler.getCreateValues({ acceptsAnswers: true }, now)).toEqual({
      postType: "poll",
      acceptsAnswers: false,
    });
  });

  it("has no post-row update fields", () => {
    expect(pollHandler.getUpdateValues({ pollQuestion: "new" })).toEqual({});
  });

  it("normalizes empty poll metadata", () => {
    expect(pollHandler.getMetadata({})).toEqual({
      pollUid: undefined,
      pollQuestion: undefined,
      pollOptions: undefined,
      pollExpiresAt: null,
      pollIsClosed: false,
      pollVotes: [],
      userPollVote: null,
    });
  });

  it("serializes Date expiry metadata", () => {
    expect(pollHandler.getMetadata({ pollExpiresAt: now }).pollExpiresAt).toBe(now.toISOString());
  });

  it("preserves already-serialized expiry metadata", () => {
    expect(pollHandler.getMetadata({ pollExpiresAt: "2026-08-21T00:00:00Z" }).pollExpiresAt)
      .toBe("2026-08-21T00:00:00Z");
  });

  it("preserves false closed state, empty votes, and zero user vote", () => {
    expect(pollHandler.getMetadata({
      pollIsClosed: false,
      pollVotes: [],
      userPollVote: 0,
    })).toMatchObject({ pollIsClosed: false, pollVotes: [], userPollVote: 0 });
  });

  it("preserves populated poll metadata", () => {
    expect(pollHandler.getMetadata({
      pollUid: "poll-1",
      pollQuestion: "Pick one",
      pollOptions: ["a", "b"],
      pollIsClosed: true,
      pollVotes: [2, 3],
      userPollVote: 1,
    })).toMatchObject({
      pollUid: "poll-1",
      pollQuestion: "Pick one",
      pollOptions: ["a", "b"],
      pollIsClosed: true,
      pollVotes: [2, 3],
      userPollVote: 1,
    });
  });

  it("does not insert a poll without a question", async () => {
    const { db, insert } = pollDb();
    await pollHandler.afterCreate!(db, "post-1", { pollOptions: ["a", "b"] }, "alice");
    expect(insert).not.toHaveBeenCalled();
  });

  it("does not insert a poll without options", async () => {
    const { db, insert } = pollDb();
    await pollHandler.afterCreate!(db, "post-1", { pollQuestion: "Pick" }, "alice");
    expect(insert).not.toHaveBeenCalled();
  });

  it("does not insert a poll when options are not an array", async () => {
    const { db, insert } = pollDb();
    await pollHandler.afterCreate!(db, "post-1", { pollQuestion: "Pick", pollOptions: "a,b" }, "alice");
    expect(insert).not.toHaveBeenCalled();
  });

  it("does not insert a poll with fewer than two options", async () => {
    const { db, insert } = pollDb();
    await pollHandler.afterCreate!(db, "post-1", { pollQuestion: "Pick", pollOptions: ["a"] }, "alice");
    expect(insert).not.toHaveBeenCalled();
  });

  it("inserts a valid poll with no expiry by default", async () => {
    const { db, insert, values } = pollDb();
    await pollHandler.afterCreate!(db, "post-1", {
      pollQuestion: "Pick",
      pollOptions: ["a", "b"],
    }, "alice");
    expect(insert).toHaveBeenCalledTimes(1);
    expect(values).toHaveBeenCalledWith({
      postUid: "post-1",
      question: "Pick",
      options: ["a", "b"],
      expiresAt: null,
    });
  });

  it("treats zero ttlHours as no expiry", async () => {
    const { db, values } = pollDb();
    await pollHandler.afterCreate!(db, "post-1", {
      pollQuestion: "Pick",
      pollOptions: ["a", "b"],
      ttlHours: 0,
    }, "alice");
    expect(values.mock.calls[0][0].expiresAt).toBeNull();
  });

  it("treats negative ttlHours as no expiry", async () => {
    const { db, values } = pollDb();
    await pollHandler.afterCreate!(db, "post-1", {
      pollQuestion: "Pick",
      pollOptions: ["a", "b"],
      ttlHours: -3,
    }, "alice");
    expect(values.mock.calls[0][0].expiresAt).toBeNull();
  });

  it("treats nonnumeric ttlHours as no expiry", async () => {
    const { db, values } = pollDb();
    await pollHandler.afterCreate!(db, "post-1", {
      pollQuestion: "Pick",
      pollOptions: ["a", "b"],
      ttlHours: "later",
    }, "alice");
    expect(values.mock.calls[0][0].expiresAt).toBeNull();
  });

  it("computes expiry from a positive numeric ttlHours", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const { db, values } = pollDb();
    await pollHandler.afterCreate!(db, "post-1", {
      pollQuestion: "Pick",
      pollOptions: ["a", "b"],
      ttlHours: 2,
    }, "alice");
    expect(values.mock.calls[0][0].expiresAt).toEqual(new Date("2026-08-20T14:00:00.000Z"));
  });

  it("accepts a positive numeric-string ttlHours", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(now);
    const { db, values } = pollDb();
    await pollHandler.afterCreate!(db, "post-1", {
      pollQuestion: "Pick",
      pollOptions: ["a", "b"],
      ttlHours: "1.5",
    }, "alice");
    expect(values.mock.calls[0][0].expiresAt).toEqual(new Date("2026-08-20T13:30:00.000Z"));
  });
});
