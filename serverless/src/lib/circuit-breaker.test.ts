import { describe, it, expect, vi } from "vitest";
import { getCircuitBreaker, circuitBreakerWrapper } from "./circuit-breaker";

describe("circuitBreaker", () => {
  it("should allow successful calls through", async () => {
    const result = await circuitBreakerWrapper("test-success", async () => "ok");
    expect(result).toBe("ok");
  });

  it("should open circuit after threshold failures", async () => {
    const cb = getCircuitBreaker("test-failure", { failureThreshold: 2, timeoutMs: 50000 });
    cb.config.failureThreshold = 2;

    await expect(
      circuitBreakerWrapper("test-failure", async () => { throw new Error("fail"); }),
    ).rejects.toThrow("fail");

    await expect(
      circuitBreakerWrapper("test-failure", async () => { throw new Error("fail"); }),
    ).rejects.toThrow("fail");

    await expect(
      circuitBreakerWrapper("test-failure", async () => "should not reach"),
    ).rejects.toThrow("Circuit breaker test-failure is open");
  });

  it("should use fallback when circuit is open", async () => {
    const cb = getCircuitBreaker("test-fallback", { failureThreshold: 1, timeoutMs: 50000 });
    cb.config.failureThreshold = 1;

    await expect(
      circuitBreakerWrapper("test-fallback", async () => { throw new Error("fail"); }),
    ).rejects.toThrow("fail");

    const result = await circuitBreakerWrapper(
      "test-fallback",
      async () => "should not reach",
      async () => "fallback",
    );
    expect(result).toBe("fallback");
  });
});
