import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toastManager } from "@/components/ui/toast";
import { removeToken } from "@/lib/utils";
import { ApiError, handleApiError, parseApiError } from "./api-error";

vi.mock("@/components/ui/toast", () => ({
  toastManager: { add: vi.fn() },
}));

vi.mock("@/lib/utils", () => ({
  removeToken: vi.fn(),
}));

const addToast = vi.mocked(toastManager.add);
const mockedRemoveToken = vi.mocked(removeToken);

const jsonResponse = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

beforeEach(() => {
  addToast.mockReset();
  mockedRemoveToken.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ApiError", () => {
  it("stores status, message, detail, and a stable error name", () => {
    const error = new ApiError(422, "bad request", "field missing");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("ApiError");
    expect(error.status).toBe(422);
    expect(error.message).toBe("bad request");
    expect(error.detail).toBe("field missing");
  });

  it("allows detail to be omitted", () => {
    expect(new ApiError(404, "missing").detail).toBeUndefined();
  });
});

describe("handleApiError", () => {
  it("shows ApiError detail when present", () => {
    handleApiError(new ApiError(500, "Something went wrong", "database timeout"), "fallback");
    expect(addToast).toHaveBeenCalledWith({
      title: "Something went wrong",
      description: "database timeout",
      type: "error",
    });
  });

  it("does not add an empty description for ApiError without detail", () => {
    handleApiError(new ApiError(400, "invalid"), "fallback");
    expect(addToast).toHaveBeenCalledWith({ title: "invalid", type: "error" });
  });

  it("uses a normal Error message", () => {
    handleApiError(new Error("offline"), "fallback");
    expect(addToast).toHaveBeenCalledWith({ title: "offline", type: "error" });
  });

  it("uses the fallback for non-Error thrown values", () => {
    handleApiError({ reason: "offline" }, "Could not save");
    expect(addToast).toHaveBeenCalledWith({ title: "Could not save", type: "error" });
  });

  it("uses the fallback for null", () => {
    handleApiError(null, "Could not save");
    expect(addToast).toHaveBeenCalledWith({ title: "Could not save", type: "error" });
  });
});

describe("parseApiError", () => {
  it("uses an error field from a JSON response", async () => {
    await expect(parseApiError(jsonResponse(400, { error: "invalid username" }))).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      message: "invalid username",
    });
  });

  it("falls back to a message field when error is absent", async () => {
    await expect(parseApiError(jsonResponse(403, { message: "forbidden" }))).rejects.toMatchObject({
      status: 403,
      message: "forbidden",
    });
  });

  it("prefers error over message when both are present", async () => {
    await expect(parseApiError(jsonResponse(400, { error: "primary", message: "secondary" }))).rejects.toMatchObject({
      message: "primary",
    });
  });

  it("uses a status fallback when JSON parsing fails", async () => {
    const res = new Response("not-json", { status: 502 });
    await expect(parseApiError(res)).rejects.toMatchObject({
      status: 502,
      message: "Request failed (502)",
    });
  });

  it("uses a status fallback for empty JSON objects", async () => {
    await expect(parseApiError(jsonResponse(404, {}))).rejects.toMatchObject({
      status: 404,
      message: "Request failed (404)",
    });
  });

  it("normalizes all 429 responses to the rate-limit message", async () => {
    await expect(parseApiError(jsonResponse(429, { error: "backend wording" }))).rejects.toMatchObject({
      status: 429,
      message: "Too many requests. Please slow down.",
    });
  });

  it("hides 500 details from the public error message", async () => {
    await expect(parseApiError(jsonResponse(500, { error: "postgres connection refused" }))).rejects.toMatchObject({
      status: 500,
      message: "Something went wrong. Please try again.",
      detail: "postgres connection refused",
    });
  });

  it("keeps the generated fallback as 500 detail when the body is unreadable", async () => {
    await expect(parseApiError(new Response("broken", { status: 500 }))).rejects.toMatchObject({
      status: 500,
      message: "Something went wrong. Please try again.",
      detail: "Request failed (500)",
    });
  });

  it("removes the token on 401 before throwing", async () => {
    await expect(parseApiError(jsonResponse(401, { error: "expired" }))).rejects.toMatchObject({
      status: 401,
      message: "expired",
    });
    expect(mockedRemoveToken).toHaveBeenCalledTimes(1);
  });

  it("does not remove the token for non-401 responses", async () => {
    await expect(parseApiError(jsonResponse(403, { error: "forbidden" }))).rejects.toBeInstanceOf(ApiError);
    expect(mockedRemoveToken).not.toHaveBeenCalled();
  });

  it("logs the internal status and selected message", async () => {
    const spy = vi.mocked(console.error);
    await expect(parseApiError(jsonResponse(400, { error: "invalid" }))).rejects.toBeInstanceOf(ApiError);
    expect(spy).toHaveBeenCalledWith("[API 400]", "invalid");
  });
});
