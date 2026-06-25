import { describe, it, expect, vi } from "vitest";
import { requireAuth, optionalAuth } from "./auth";

function createMockContext(authorization?: string) {
  const vars: Record<string, unknown> = {};
  return {
    req: {
      header: vi.fn((name: string) =>
        name === "Authorization" ? authorization : undefined,
      ),
    },
    env: {
      SECRET_KEY: "test-secret-key-for-testing-123",
    },
    set: vi.fn((name: string, value: unknown) => {
      vars[name] = value;
    }),
    get: (name: string) => vars[name],
    // Hono also expects res and other properties
    res: {},
    var: vars,
    event: {},
    executionCtx: {},
    newResponse: vi.fn(),
    body: null,
    status: 200,
    header: vi.fn(),
  } as any;
}

describe("requireAuth", () => {
  it("sets user on context when token is valid", async () => {
    // First issue a real token
    const { issueAuthToken } = await import("../lib/auth");
    const token = await issueAuthToken(
      "test-secret-key-for-testing-123",
      "alice",
    );

    const c = createMockContext(`Bearer ${token}`);
    const next = vi.fn();

    await requireAuth(c, next);

    expect(c.set).toHaveBeenCalledWith("user", "alice");
    expect(next).toHaveBeenCalledOnce();
  });

  it("throws 401 when authorization header is missing", async () => {
    const c = createMockContext();
    const next = vi.fn();

    await expect(requireAuth(c, next)).rejects.toThrow("missing token");
    expect(next).not.toHaveBeenCalled();
  });

  it("throws 401 when header is not Bearer", async () => {
    const c = createMockContext("Basic token123");
    const next = vi.fn();

    await expect(requireAuth(c, next)).rejects.toThrow(
      "invalid authorization header",
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("throws 401 when token is empty after Bearer", async () => {
    const c = createMockContext("Bearer   ");
    const next = vi.fn();

    await expect(requireAuth(c, next)).rejects.toThrow("invalid token");
    expect(next).not.toHaveBeenCalled();
  });

  it("throws 401 when token is invalid", async () => {
    const c = createMockContext("Bearer invalid-token");
    const next = vi.fn();

    await expect(requireAuth(c, next)).rejects.toThrow("invalid token");
    expect(next).not.toHaveBeenCalled();
  });
});

describe("optionalAuth", () => {
  it("sets user when token is valid", async () => {
    const { issueAuthToken } = await import("../lib/auth");
    const token = await issueAuthToken(
      "test-secret-key-for-testing-123",
      "bob",
    );

    const c = createMockContext(`Bearer ${token}`);
    const next = vi.fn();

    await optionalAuth(c, next);

    expect(c.set).toHaveBeenCalledWith("user", "bob");
    expect(next).toHaveBeenCalledOnce();
  });

  it("proceeds without setting user when no auth header", async () => {
    const c = createMockContext();
    const next = vi.fn();

    await optionalAuth(c, next);

    expect(c.set).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });

  it("silently ignores invalid token and proceeds", async () => {
    const c = createMockContext("Bearer invalid-token");
    const next = vi.fn();

    await optionalAuth(c, next);

    expect(c.set).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });

  it("proceeds when header does not start with Bearer", async () => {
    const c = createMockContext("Basic token123");
    const next = vi.fn();

    await optionalAuth(c, next);

    expect(c.set).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledOnce();
  });
});
