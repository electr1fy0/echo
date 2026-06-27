import type { PostTypeHandler, PostTypeHandlerRegistry } from "./handler";
import { qnaHandler } from "./qna";
import { partnerHandler } from "./partner";
import { tradeHandler } from "./trade";
import { taxiHandler } from "./taxi";
import { pollHandler } from "./poll";

const handlers: PostTypeHandler[] = [qnaHandler, partnerHandler, tradeHandler, taxiHandler, pollHandler];

export const registry: PostTypeHandlerRegistry = new Map(
  handlers.map((h) => [h.type, h]),
);

export const getHandler = (type: string): PostTypeHandler => {
  return registry.get(type) ?? qnaHandler;
};

export type { PostTypeHandler } from "./handler";
