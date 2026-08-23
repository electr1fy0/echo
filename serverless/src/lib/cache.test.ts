import { describe, expect, it, vi } from "vitest";
import { cacheNone, cachePrivate, cachePublic, setCache } from "./cache";

const context = () => ({ header: vi.fn() }) as any;

const expectCacheControl = (c: ReturnType<typeof context>, value: string) => {
  expect(c.header).toHaveBeenCalledTimes(1);
  expect(c.header).toHaveBeenCalledWith("Cache-Control", value);
};

describe("cache helpers", () => {
  it("uses the public cache defaults", () => {
    const c = context();
    cachePublic(c);
    expectCacheControl(c, "public, max-age=60, s-maxage=300, stale-while-revalidate=600");
  });

  it("preserves explicit zero public cache durations", () => {
    const c = context();
    cachePublic(c, 0, 0);
    expectCacheControl(c, "public, max-age=0, s-maxage=0, stale-while-revalidate=600");
  });

  it("uses a custom public browser and shared-cache lifetime", () => {
    const c = context();
    cachePublic(c, 15, 90);
    expectCacheControl(c, "public, max-age=15, s-maxage=90, stale-while-revalidate=600");
  });

  it("uses the private cache default", () => {
    const c = context();
    cachePrivate(c);
    expectCacheControl(c, "private, max-age=10");
  });

  it("preserves an explicit zero private cache lifetime", () => {
    const c = context();
    cachePrivate(c, 0);
    expectCacheControl(c, "private, max-age=0");
  });

  it("disables storage entirely for cacheNone", () => {
    const c = context();
    cacheNone(c);
    expectCacheControl(c, "no-store");
  });

  it("combines cache directives in a stable order", () => {
    const c = context();
    setCache(c, {
      noCache: true,
      public: true,
      private: true,
      maxAge: 0,
      sMaxage: 120,
      mustRevalidate: true,
      staleWhileRevalidate: 30,
    });
    expectCacheControl(
      c,
      "no-cache, public, private, max-age=0, s-maxage=120, must-revalidate, stale-while-revalidate=30",
    );
  });

  it("lets no-store override every other directive", () => {
    const c = context();
    setCache(c, {
      noStore: true,
      noCache: true,
      public: true,
      maxAge: 60,
      mustRevalidate: true,
    });
    expectCacheControl(c, "no-store");
  });

  it("emits an empty value for an empty directive object", () => {
    const c = context();
    setCache(c, {});
    expectCacheControl(c, "");
  });
});
