import { afterEach, describe, expect, it, vi } from "vitest";
import { HTTPException } from "hono/http-exception";
import { ApiError } from "./errors";
import { handleAppError } from "./http";

const context = () => ({
  json: vi.fn((body: unknown, status: number) => ({ body, status })),
}) as any;

afterEach(() => {
  vi.restoreAllMocks();
});

describe("handleAppError", () => {
  it("returns ApiError messages and statuses unchanged", () => {
    const c = context();
    const result = handleAppError(new ApiError(422, "invalid profile"), c);
    expect(c.json).toHaveBeenCalledWith({ error: "invalid profile" }, 422);
    expect(result).toEqual({ body: { error: "invalid profile" }, status: 422 });
  });

  it("supports nonstandard but valid application statuses", () => {
    const c = context();
    handleAppError(new ApiError(418, "teapot"), c);
    expect(c.json).toHaveBeenCalledWith({ error: "teapot" }, 418);
  });

  it("maps HTTPException to its status and message", () => {
    const c = context();
    handleAppError(new HTTPException(403, { message: "forbidden" }), c);
    expect(c.json).toHaveBeenCalledWith({ error: "forbidden" }, 403);
  });

  it("maps SyntaxError to an invalid-body response", () => {
    const c = context();
    handleAppError(new SyntaxError("Unexpected token"), c);
    expect(c.json).toHaveBeenCalledWith({ error: "invalid request body" }, 400);
  });

  it("does not log expected ApiErrors", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    handleAppError(new ApiError(404, "missing"), context());
    expect(spy).not.toHaveBeenCalled();
  });

  it("does not log expected HTTPExceptions", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    handleAppError(new HTTPException(401, { message: "unauthorized" }), context());
    expect(spy).not.toHaveBeenCalled();
  });

  it("does not log malformed JSON errors", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    handleAppError(new SyntaxError("bad json"), context());
    expect(spy).not.toHaveBeenCalled();
  });

  it("hides unexpected Error messages behind a generic 500", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const c = context();
    handleAppError(new Error("database password leaked"), c);
    expect(c.json).toHaveBeenCalledWith({ error: "internal server error" }, 500);
    expect(spy).toHaveBeenCalledWith("unhandled error:", expect.any(Error));
  });

  it("handles non-Error thrown values", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const c = context();
    handleAppError("boom", c);
    expect(c.json).toHaveBeenCalledWith({ error: "internal server error" }, 500);
    expect(spy).toHaveBeenCalledWith("unhandled error:", "boom");
  });

  it("handles null as an unexpected thrown value", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const c = context();
    handleAppError(null, c);
    expect(c.json).toHaveBeenCalledWith({ error: "internal server error" }, 500);
    expect(spy).toHaveBeenCalledWith("unhandled error:", null);
  });
});
