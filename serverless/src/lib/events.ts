import type { DB } from "../db";
import type { Bindings } from "../types/app";

type EventContext = {
  db: DB;
  env: Bindings;
  waitUntil: (p: Promise<unknown>) => void;
};

type EventHandler<E> = (data: E, ctx: EventContext) => Promise<void>;

class EventBus {
  private handlers = new Map<string, EventHandler<any>[]>();

  on<E>(event: string, handler: EventHandler<E>) {
    const handlers = this.handlers.get(event) ?? [];
    handlers.push(handler);
    this.handlers.set(event, handlers);
  }

  emit<E>(event: string, data: E, ctx: EventContext) {
    const handlers = this.handlers.get(event);
    if (!handlers) return;
    for (const handler of handlers) {
      try {
        const result = handler(data, ctx);
        if (result && typeof result.catch === "function") {
          ctx.waitUntil(
            result.catch((err) => {
              console.error(`[events] ${event} handler error:`, err);
            }),
          );
        }
      } catch (err) {
        console.error(`[events] ${event} handler error:`, err);
      }
    }
  }
}

export const eventBus = new EventBus();

export const Events = {
  UserRegistered: "user:registered",
  PostCreated: "post:created",
  PostUpvoted: "post:upvoted",
  ReplyCreated: "reply:created",
  UserFollowed: "user:followed",
  PollVoted: "poll:voted",
} as const;
