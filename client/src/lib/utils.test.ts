import { describe, it, expect, beforeEach, vi } from "vitest";

const store: Record<string, string> = {};
const mockStorage = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
  get length() { return Object.keys(store).length; },
  key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
};

vi.stubGlobal("localStorage", mockStorage);

const eventListeners: Record<string, (() => void)[]> = {};
vi.stubGlobal("window", {
  ...globalThis.window,
  addEventListener: vi.fn((e: string, cb: () => void) => {
    (eventListeners[e] ??= []).push(cb);
  }),
  dispatchEvent: vi.fn((e: Event) => {
    eventListeners[e.type]?.forEach((cb) => cb());
  }),
});

import {
  getToken,
  setToken,
  removeToken,
  getAuthHeaders,
  getInitials,
  cn,
} from "./utils";

describe("token management", () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    vi.clearAllMocks();
  });

  describe("getToken", () => {
    it("returns null when no token is stored", () => {
      expect(getToken()).toBeNull();
    });

    it("returns the stored token", () => {
      store["token"] = "my-token";
      expect(getToken()).toBe("my-token");
    });
  });

  describe("setToken", () => {
    it("stores the token in localStorage", () => {
      setToken("my-token");
      expect(store["token"]).toBe("my-token");
    });

    it("dispatches auth-token-change event", () => {
      const fired: string[] = [];
      eventListeners["auth-token-change"] = [() => fired.push("fired")];

      setToken("my-token");
      expect(fired).toContain("fired");
    });
  });

  describe("removeToken", () => {
    it("removes the token from localStorage", () => {
      store["token"] = "my-token";
      removeToken();
      expect(store["token"]).toBeUndefined();
    });

    it("dispatches auth-token-change event", () => {
      const fired: string[] = [];
      eventListeners["auth-token-change"] = [() => fired.push("fired")];

      removeToken();
      expect(fired).toContain("fired");
    });
  });
});

describe("getAuthHeaders", () => {
  it("returns empty object when no token", () => {
    expect(getAuthHeaders()).toEqual({});
  });

  it("returns Bearer header when token exists", () => {
    store["token"] = "my-token";
    expect(getAuthHeaders()).toEqual({ Authorization: "Bearer my-token" });
  });
});

describe("getInitials", () => {
  it("returns first letters of first two parts", () => {
    expect(getInitials("alice smith")).toBe("AS");
  });

  it("returns first two chars for single name", () => {
    expect(getInitials("alice")).toBe("AL");
  });

  it("handles extra spaces", () => {
    expect(getInitials("  alice   smith  ")).toBe("AS");
  });
});

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("resolves tailwind conflicts", () => {
    expect(cn("px-4", "px-6")).toBe("px-6");
  });
});
