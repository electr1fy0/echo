import type { PostTypeHandler } from "./handler";

export const tradeHandler: PostTypeHandler = {
  type: "trade",
  getCreateValues(body) {
    return {
      postType: "trade",
      tradePrice: body.tradePrice ?? null,
      tradeCondition: body.tradeCondition ?? null,
      tradeBookIsbn: body.tradeBookIsbn ?? null,
      tradeStatus: "available",
      acceptsAnswers: false,
    };
  },
  getUpdateValues(body) {
    const values: Record<string, unknown> = {};
    if (body.tradePrice !== undefined) values.tradePrice = body.tradePrice;
    if (body.tradeCondition !== undefined) values.tradeCondition = body.tradeCondition;
    if (body.tradeBookIsbn !== undefined) values.tradeBookIsbn = body.tradeBookIsbn;
    if (body.tradeStatus !== undefined) values.tradeStatus = body.tradeStatus;
    return values;
  },
  getMetadata(row) {
    return {
      tradePrice: row.tradePrice ?? null,
      tradeCondition: row.tradeCondition ?? null,
      tradeBookIsbn: row.tradeBookIsbn ?? null,
      tradeStatus: row.tradeStatus ?? null,
    };
  },
};
