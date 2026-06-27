import { describe, it, expect, vi } from "vitest";
import { eventBus, Events } from "./events";

describe("eventBus", () => {
  it("should register and emit events", async () => {
    const handler = vi.fn();
    eventBus.on<{ value: number }>(Events.UserRegistered, handler);

    const ctx = { db: {} as any, env: {} as any, waitUntil: vi.fn() };
    eventBus.emit(Events.UserRegistered, { username: "testuser" }, ctx);

    await vi.waitFor(() => {
      expect(handler).toHaveBeenCalledWith(
        { username: "testuser" },
        expect.objectContaining({ db: ctx.db, env: ctx.env }),
      );
    });
  });

  it("should not throw for unregistered events", () => {
    const ctx = { db: {} as any, env: {} as any, waitUntil: vi.fn() };
    expect(() => {
      eventBus.emit("nonexistent:event" as any, {}, ctx);
    }).not.toThrow();
  });

  it("should handle handler errors gracefully", async () => {
    const handler = vi.fn().mockRejectedValue(new Error("handler error"));
    eventBus.on("test:error", handler);

    const ctx = { db: {} as any, env: {} as any, waitUntil: vi.fn() };

    expect(() => {
      eventBus.emit("test:error", {}, ctx);
    }).not.toThrow();

    await vi.waitFor(() => {
      expect(ctx.waitUntil).toHaveBeenCalled();
    });
  });
});
