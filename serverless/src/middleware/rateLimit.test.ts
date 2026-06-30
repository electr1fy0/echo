import { describe, it, expect, vi, beforeEach } from "vitest";
import { rateLimit, inMemoryRateLimit } from "./rateLimit";

function createMockContext(options: {
  method?: string;
  url?: string;
  authorization?: string;
  cfConnectingIp?: string;
  env?: Record<string, unknown>;
}) {
  const vars: Record<string, unknown> = {};
  return {
    req: {
      method: options.method ?? "GET",
      url: options.url ?? "http://example.com/api/test",
      header: vi.fn((name: string) => {
        if (name === "Authorization") return options.authorization;
        if (name === "CF-Connecting-IP") return options.cfConnectingIp;
        return undefined;
      }),
    },
    env: options.env ?? {},
    set: vi.fn((name: string, value: unknown) => {
      vars[name] = value;
    }),
    get: (name: string) => vars[name],
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

function uniqueRequest(ip?: string, method = "POST") {
  const actualIp = ip ?? `test-${Math.random().toString(36).slice(2, 10)}`;
  const c = createMockContext({ method, cfConnectingIp: actualIp });
  const n = vi.fn();
  return { c, next: n, ip: actualIp };
}

describe("rateLimit", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("skip conditions", () => {
    it("skips OPTIONS requests", async () => {
      const mw = rateLimit("API_LIMITER");
      const c = createMockContext({ method: "OPTIONS" });
      const next = vi.fn();
      await mw(c, next);
      expect(next).toHaveBeenCalledOnce();
    });

    it.each([
      ["/ping", "http://example.com/ping"],
      ["/images/abc.jpg", "http://example.com/images/abc.jpg"],
      ["/images/some/deep/path.png", "http://example.com/images/some/deep/path.png"],
      ["/api/messages/unread-count", "http://example.com/api/messages/unread-count"],
      ["/api/chats/read", "http://example.com/api/chats/read"],
    ])("skips %s path", async (_label, url) => {
      const mw = rateLimit("API_LIMITER");
      const c = createMockContext({ method: "POST", url });
      const next = vi.fn();
      await mw(c, next);
      expect(next).toHaveBeenCalledOnce();
    });

    it("does not skip non-excluded paths with POST", async () => {
      const mw = rateLimit("API_LIMITER", { limitFallback: 100, periodFallback: 60 });
      const { c, next } = uniqueRequest("skip-non-excluded");
      await mw(c, next);
      expect(next).toHaveBeenCalledOnce();
    });
  });

  describe("identifier selection", () => {
    it("uses Authorization Bearer header as identifier", async () => {
      const limit = vi.fn().mockResolvedValue({ success: true });
      const mw = rateLimit("API_LIMITER");
      const c = createMockContext({
        method: "GET",
        authorization: "Bearer token-abc-123",
        env: { API_LIMITER: { limit } },
      });
      const next = vi.fn();
      await mw(c, next);
      expect(limit).toHaveBeenCalledWith({ key: expect.stringContaining("Bearer token-abc-123:read") });
    });

    it("uses CF-Connecting-IP when no auth header", async () => {
      const limit = vi.fn().mockResolvedValue({ success: true });
      const mw = rateLimit("API_LIMITER");
      const c = createMockContext({
        method: "GET",
        cfConnectingIp: "203.0.113.42",
        env: { API_LIMITER: { limit } },
      });
      const next = vi.fn();
      await mw(c, next);
      expect(limit).toHaveBeenCalledWith({ key: expect.stringContaining("203.0.113.42:read") });
    });

    it("falls back to 127.0.0.1 when no auth or IP header", async () => {
      const limit = vi.fn().mockResolvedValue({ success: true });
      const mw = rateLimit("API_LIMITER");
      const c = createMockContext({ method: "GET", env: { API_LIMITER: { limit } } });
      const next = vi.fn();
      await mw(c, next);
      expect(limit).toHaveBeenCalledWith({ key: expect.stringContaining("127.0.0.1:read") });
    });
  });

  describe("in-memory limiter (no binding)", () => {
    it("allows requests within the limit", async () => {
      const mw = rateLimit("API_LIMITER", { limitFallback: 3, periodFallback: 10 });
      const { c, next } = uniqueRequest("mem-allow");
      await mw(c, next);
      expect(next).toHaveBeenCalledOnce();
    });

    it("blocks requests that exceed the limit", async () => {
      const mw = rateLimit("API_LIMITER", { limitFallback: 2, periodFallback: 10 });
      const ip = "mem-exceed";

      const r1 = uniqueRequest(ip);
      await mw(r1.c, r1.next);
      expect(r1.next).toHaveBeenCalledOnce();

      const r2 = uniqueRequest(ip);
      await mw(r2.c, r2.next);
      expect(r2.next).toHaveBeenCalledOnce();

      const r3 = uniqueRequest(ip);
      await expect(mw(r3.c, r3.next)).rejects.toThrow("Too many requests. Please try again later.");
      expect(r3.next).not.toHaveBeenCalled();
    });

    it("uses higher limit for reads than writes", async () => {
      const mw = rateLimit("API_LIMITER", { limitFallback: 5, readLimitFallback: 100, periodFallback: 10 });
      const ip = "read-write-diff";

      // Reads (GET) can do many more requests than writes (POST)
      for (let i = 0; i < 50; i++) {
        const c = createMockContext({ method: "GET", cfConnectingIp: ip });
        const next = vi.fn();
        await mw(c, next);
        expect(next).toHaveBeenCalled();
      }

      // Writes (POST) hit the lower limit quickly
      for (let i = 0; i < 5; i++) {
        const c = createMockContext({ method: "POST", cfConnectingIp: ip });
        const next = vi.fn();
        await mw(c, next);
        expect(next).toHaveBeenCalled();
      }

      // 6th write should be blocked
      const c = createMockContext({ method: "POST", cfConnectingIp: ip });
      const next = vi.fn();
      await expect(mw(c, next)).rejects.toThrow("Too many requests. Please try again later.");
    });

    it("different keys are tracked independently", async () => {
      const mw = rateLimit("API_LIMITER", { limitFallback: 1, periodFallback: 10 });

      const r1 = uniqueRequest("independent-a");
      await mw(r1.c, r1.next);
      expect(r1.next).toHaveBeenCalledOnce();

      const r2 = uniqueRequest("independent-b");
      await mw(r2.c, r2.next);
      expect(r2.next).toHaveBeenCalledOnce();
    });
  });

  describe("Cloudflare binding", () => {
    it("passes through when binding returns success: true", async () => {
      const limit = vi.fn().mockResolvedValue({ success: true });
      const mw = rateLimit("API_LIMITER");
      const c = createMockContext({
        method: "POST",
        cfConnectingIp: "binding-pass",
        env: { API_LIMITER: { limit } },
      });
      const next = vi.fn();
      await mw(c, next);
      expect(limit).toHaveBeenCalledOnce();
      expect(next).toHaveBeenCalledOnce();
    });

    it("throws 429 when binding returns success: false", async () => {
      const limit = vi.fn().mockResolvedValue({ success: false });
      const mw = rateLimit("API_LIMITER");
      const c = createMockContext({
        method: "POST",
        cfConnectingIp: "binding-block",
        env: { API_LIMITER: { limit } },
      });
      const next = vi.fn();
      await expect(mw(c, next)).rejects.toThrow("Too many requests. Please try again later.");
      expect(next).not.toHaveBeenCalled();
    });

    it("falls back to in-memory limiter when binding throws", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const limit = vi.fn().mockRejectedValue(new Error("network error"));
      const mw = rateLimit("API_LIMITER", { limitFallback: 5, periodFallback: 10 });
      const ip = "binding-fallback";

      const r1 = uniqueRequest(ip);
      r1.c.env = { API_LIMITER: { limit } };
      await mw(r1.c, r1.next);
      expect(r1.next).toHaveBeenCalledOnce();
    });

    it("selects AUTH_LIMITER binding when configured", async () => {
      const limit = vi.fn().mockResolvedValue({ success: true });
      const mw = rateLimit("AUTH_LIMITER");
      const c = createMockContext({
        method: "POST",
        cfConnectingIp: "auth-binding",
        env: { API_LIMITER: { limit: vi.fn() }, AUTH_LIMITER: { limit } },
      });
      const next = vi.fn();
      await mw(c, next);
      expect(limit).toHaveBeenCalledOnce();
    });

    it("uses the correct key format with keyPrefix and limiterName", async () => {
      const limit = vi.fn().mockResolvedValue({ success: true });
      const mw = rateLimit("AUTH_LIMITER", { keyPrefix: "auth" });
      const c = createMockContext({
        method: "POST",
        authorization: "Bearer test-token",
        env: { AUTH_LIMITER: { limit } },
      });
      const next = vi.fn();
      await mw(c, next);
      expect(limit).toHaveBeenCalledWith({ key: "auth:AUTH_LIMITER:Bearer test-token:write" });
    });
  });
});

describe("inMemoryRateLimit", () => {
  it("allows requests within the limit", async () => {
    const mw = inMemoryRateLimit("test", 5, 10);
    const { c, next } = uniqueRequest("im-allow");
    await mw(c, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("blocks requests that exceed the limit", async () => {
    const mw = inMemoryRateLimit("test", 2, 10);
    const ip = "im-block";

    const r1 = uniqueRequest(ip);
    await mw(r1.c, r1.next);
    expect(r1.next).toHaveBeenCalledOnce();

    const r2 = uniqueRequest(ip);
    await mw(r2.c, r2.next);
    expect(r2.next).toHaveBeenCalledOnce();

    const r3 = uniqueRequest(ip);
    await expect(mw(r3.c, r3.next)).rejects.toThrow("Too many requests. Please try again later.");
    expect(r3.next).not.toHaveBeenCalled();
  });

  it("uses Authorization Bearer header as identifier", async () => {
    const mw = inMemoryRateLimit("test", 100, 60);
    const c = createMockContext({ authorization: "Bearer my-token" });
    const next = vi.fn();
    await mw(c, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("uses CF-Connecting-IP when no auth header", async () => {
    const mw = inMemoryRateLimit("test", 100, 60);
    const c = createMockContext({ cfConnectingIp: "198.51.100.1" });
    const next = vi.fn();
    await mw(c, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("skips OPTIONS requests", async () => {
    const mw = inMemoryRateLimit("test", 0, 10);
    const c = createMockContext({ method: "OPTIONS" });
    const next = vi.fn();
    await mw(c, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("different keyPrefixes are tracked independently", async () => {
    const ip = "independent-prefix";
    const mw1 = inMemoryRateLimit("prefix-a", 1, 10);
    const mw2 = inMemoryRateLimit("prefix-b", 1, 10);

    const r1 = uniqueRequest(ip);
    await mw1(r1.c, r1.next);
    expect(r1.next).toHaveBeenCalledOnce();

    const r2 = uniqueRequest(ip);
    await mw2(r2.c, r2.next);
    expect(r2.next).toHaveBeenCalledOnce();
  });
});
