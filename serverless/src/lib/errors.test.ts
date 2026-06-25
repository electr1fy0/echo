import { describe, it, expect } from "vitest";
import { ApiError, isApiError } from "./errors";

describe("ApiError", () => {
  it("creates an error with the given status and message", () => {
    const error = new ApiError(404, "not found");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ApiError");
    expect(error.status).toBe(404);
    expect(error.message).toBe("not found");
  });

  it("creates an error with different status codes", () => {
    expect(new ApiError(400, "bad request").status).toBe(400);
    expect(new ApiError(401, "unauthorized").status).toBe(401);
    expect(new ApiError(500, "server error").status).toBe(500);
  });
});

describe("isApiError", () => {
  it("returns true for ApiError instances", () => {
    expect(isApiError(new ApiError(400, "bad request"))).toBe(true);
  });

  it("returns false for regular Error", () => {
    expect(isApiError(new Error("regular"))).toBe(false);
  });

  it("returns false for non-error values", () => {
    expect(isApiError(null)).toBe(false);
    expect(isApiError(undefined)).toBe(false);
    expect(isApiError({ status: 400 })).toBe(false);
    expect(isApiError("string")).toBe(false);
  });
});
