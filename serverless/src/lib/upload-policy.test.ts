import { describe, expect, it } from "vitest";
import { ApiError } from "./errors";
import { assertAllowedUpload, MAX_UPLOAD_SIZE, safeFileExtension } from "./upload-policy";

describe("upload policy", () => {
  it("accepts allowed content types at the exact size limit", () => {
    expect(() => assertAllowedUpload("application/pdf", MAX_UPLOAD_SIZE)).not.toThrow();
  });

  it("rejects files one byte above the size limit", () => {
    expect(() => assertAllowedUpload("application/pdf", MAX_UPLOAD_SIZE + 1)).toThrow(ApiError);
  });

  it("rejects negative and non-finite sizes", () => {
    expect(() => assertAllowedUpload("image/png", -1)).toThrow("invalid file size");
    expect(() => assertAllowedUpload("image/png", Number.NaN)).toThrow("invalid file size");
    expect(() => assertAllowedUpload("image/png", Number.POSITIVE_INFINITY)).toThrow("invalid file size");
  });

  it("rejects MIME types outside the allowlist", () => {
    expect(() => assertAllowedUpload("text/html", 10)).toThrow("unsupported content type");
    expect(() => assertAllowedUpload("image/svg+xml", 10)).toThrow("unsupported content type");
  });

  it("normalizes safe extensions", () => {
    expect(safeFileExtension("notes.PDF")).toBe("pdf");
    expect(safeFileExtension("archive.tar.gz")).toBe("gz");
  });

  it("falls back to bin for path-like or suspicious extensions", () => {
    expect(safeFileExtension("report.pdf/evil")).toBe("bin");
    expect(safeFileExtension("file.superlongextension")).toBe("bin");
    expect(safeFileExtension("no-extension")).toBe("bin");
    expect(safeFileExtension("file.pd f")).toBe("bin");
  });
});
