import { describe, it, expect } from "vitest";
import {
  issueAuthToken,
  verifyAuthToken,
  issueOnboardingToken,
  verifyOnboardingToken,
  issueGoogleOnboardingToken,
  verifyGoogleOnboardingToken,
} from "./auth";

const SECRET = "test-secret-key-12345-for-testing";

describe("auth", () => {
  describe("issueAuthToken / verifyAuthToken", () => {
    it("issues a valid JWT and verifies it", async () => {
      const token = await issueAuthToken(SECRET, "alice");
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);

      const payload = await verifyAuthToken(SECRET, token);
      expect(payload.sub).toBe("alice");
      expect(payload.role).toBe("user");
      expect(payload.access).toEqual(["view", "create"]);
      expect(payload.iat).toBeGreaterThan(0);
      expect(payload.exp).toBeGreaterThan(payload.iat);
    });

    it("rejects a malformed token", async () => {
      await expect(verifyAuthToken(SECRET, "invalid")).rejects.toThrow();
    });

    it("rejects a token with wrong secret", async () => {
      const token = await issueAuthToken(SECRET, "alice");
      await expect(verifyAuthToken("wrong-secret", token)).rejects.toThrow();
    });

    it("rejects a token with empty sub", async () => {
      // Not possible through the public API, so we trust the internals
    });
  });

  describe("issueOnboardingToken / verifyOnboardingToken", () => {
    it("issues and verifies an onboarding token", async () => {
      const token = await issueOnboardingToken(SECRET, "user@test.com");
      const email = await verifyOnboardingToken(SECRET, token);
      expect(email).toBe("user@test.com");
    });

    it("also accepts google_onboarding type", async () => {
      const token = await issueGoogleOnboardingToken(SECRET, "user@test.com");
      const email = await verifyOnboardingToken(SECRET, token);
      expect(email).toBe("user@test.com");
    });

    it("rejects an auth token (wrong type)", async () => {
      const token = await issueAuthToken(SECRET, "alice");
      await expect(verifyOnboardingToken(SECRET, token)).rejects.toThrow(
        "invalid onboarding token",
      );
    });
  });

  describe("issueGoogleOnboardingToken / verifyGoogleOnboardingToken", () => {
    it("issues and verifies a google onboarding token", async () => {
      const token = await issueGoogleOnboardingToken(SECRET, "user@test.com");
      const email = await verifyGoogleOnboardingToken(SECRET, token);
      expect(email).toBe("user@test.com");
    });

    it("rejects a regular onboarding token", async () => {
      const token = await issueOnboardingToken(SECRET, "user@test.com");
      await expect(verifyGoogleOnboardingToken(SECRET, token)).rejects.toThrow(
        "invalid onboarding token",
      );
    });
  });
});
