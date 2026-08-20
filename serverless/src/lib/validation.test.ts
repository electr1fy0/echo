import { describe, expect, it } from "vitest";
import {
  confirmEmailChangeSchema,
  createPostSchema,
  createReplySchema,
  partnerApplySchema,
  safeParse,
  usernameSchema,
  verifyOtpSchema,
} from "./validation";

describe("validation edge cases", () => {
  it("normalizes usernames and rejects reserved names case-insensitively", () => {
    expect(usernameSchema.parse("Alice_1")).toBe("alice_1");
    expect(() => usernameSchema.parse("AdMiN")).toThrow();
  });

  it("requires complete poll metadata for poll posts", () => {
    expect(() => safeParse(createPostSchema, {
      chamberUid: "chamber-1",
      postType: "poll",
      content: "vote",
    })).toThrow("poll question is required");

    expect(() => safeParse(createPostSchema, {
      chamberUid: "chamber-1",
      postType: "poll",
      content: "vote",
      pollQuestion: "Pick one",
      pollOptions: ["Only one"],
    })).toThrow();
  });

  it("rejects duplicate poll options after trimming", () => {
    expect(() => safeParse(createPostSchema, {
      chamberUid: "chamber-1",
      postType: "poll",
      pollQuestion: "Pick one",
      pollOptions: ["A", " A "],
    })).toThrow("poll options must be unique");
  });

  it("rejects impossible numeric domain values", () => {
    expect(() => safeParse(createPostSchema, {
      chamberUid: "chamber-1",
      postType: "trade",
      tradePrice: -1,
    })).toThrow();

    expect(() => safeParse(createPostSchema, {
      chamberUid: "chamber-1",
      postType: "taxi",
      taxiSeatsAvailable: 0,
    })).toThrow();

    expect(() => safeParse(createPostSchema, {
      chamberUid: "chamber-1",
      postType: "partner",
      partnerSlotsNeeded: 0,
    })).toThrow();
  });

  it("rejects whitespace-only replies and partner pitches", () => {
    expect(() => safeParse(createReplySchema, { content: "   " })).toThrow();
    expect(() => safeParse(partnerApplySchema, { pitch: "\n\t " })).toThrow();
  });

  it("accepts exactly six numeric OTP digits", () => {
    expect(verifyOtpSchema.parse({ email: "alice@example.com", otp: "012345" }).otp).toBe("012345");
    expect(confirmEmailChangeSchema.parse({ otp: "999999" }).otp).toBe("999999");
  });

  it("rejects alphabetic, short, and overlong OTP values", () => {
    expect(() => verifyOtpSchema.parse({ email: "alice@example.com", otp: "abcdef" })).toThrow("otp must be 6 digits");
    expect(() => verifyOtpSchema.parse({ email: "alice@example.com", otp: "12345" })).toThrow("otp must be 6 digits");
    expect(() => confirmEmailChangeSchema.parse({ otp: "1234567" })).toThrow("otp must be 6 digits");
  });
});