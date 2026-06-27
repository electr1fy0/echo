import type { DB } from "../../db";

export interface PostTypeHandler {
  type: string;
  getCreateValues(body: Record<string, unknown>, now: Date): Record<string, unknown>;
  getUpdateValues(body: Record<string, unknown>): Record<string, unknown>;
  getMetadata(row: Record<string, unknown>): Record<string, unknown>;
  afterCreate?(db: DB, postUid: string, body: Record<string, unknown>, author: string): Promise<void>;
}

export type PostTypeHandlerRegistry = Map<string, PostTypeHandler>;
