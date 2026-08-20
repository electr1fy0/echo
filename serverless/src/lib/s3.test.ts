import { afterEach, describe, expect, it, vi } from "vitest";
import { generatePresignedPutUrl } from "./s3";

afterEach(() => {
  vi.useRealTimers();
});

describe("generatePresignedPutUrl", () => {
  it("produces a deterministic SigV4 PUT URL with bounded expiry", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-02T03:04:05.000Z"));

    const result = await generatePresignedPutUrl(
      "acct",
      "access",
      "secret",
      "bucket",
      "uploads/file.pdf",
      600,
    );
    const url = new URL(result);

    expect(url.origin).toBe("https://acct.r2.cloudflarestorage.com");
    expect(url.pathname).toBe("/bucket/uploads/file.pdf");
    expect(url.searchParams.get("X-Amz-Algorithm")).toBe("AWS4-HMAC-SHA256");
    expect(url.searchParams.get("X-Amz-Date")).toBe("20260102T030405Z");
    expect(url.searchParams.get("X-Amz-Expires")).toBe("600");
    expect(url.searchParams.get("X-Amz-SignedHeaders")).toBe("host");
    expect(url.searchParams.get("X-Amz-Signature")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("binds the signature to Content-Type when provided", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-02T03:04:05.000Z"));

    const withoutType = await generatePresignedPutUrl(
      "acct", "access", "secret", "bucket", "uploads/file.pdf", 600,
    );
    const withType = await generatePresignedPutUrl(
      "acct", "access", "secret", "bucket", "uploads/file.pdf", 600, "application/pdf",
    );

    const typedUrl = new URL(withType);
    expect(typedUrl.searchParams.get("X-Amz-SignedHeaders")).toBe("content-type;host");
    expect(new URL(withoutType).searchParams.get("X-Amz-Signature"))
      .not.toBe(typedUrl.searchParams.get("X-Amz-Signature"));
  });

  it("changes the signature when expiry or object key changes", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-02T03:04:05.000Z"));

    const base = new URL(await generatePresignedPutUrl("acct", "access", "secret", "bucket", "uploads/a.pdf", 600));
    const otherKey = new URL(await generatePresignedPutUrl("acct", "access", "secret", "bucket", "uploads/b.pdf", 600));
    const otherExpiry = new URL(await generatePresignedPutUrl("acct", "access", "secret", "bucket", "uploads/a.pdf", 601));

    expect(base.searchParams.get("X-Amz-Signature")).not.toBe(otherKey.searchParams.get("X-Amz-Signature"));
    expect(base.searchParams.get("X-Amz-Signature")).not.toBe(otherExpiry.searchParams.get("X-Amz-Signature"));
  });
});
