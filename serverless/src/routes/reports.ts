import { Hono } from "hono";
import { eq, and } from "drizzle-orm";

import { schema } from "../db";
import { ApiError } from "../lib/errors";
import { requireAuth } from "../middleware/auth";
import { inMemoryRateLimit } from "../middleware/rateLimit";
import { safeParse, createReportSchema } from "../lib/validation";
import type { AppEnv } from "../types/app";

const reportLimiter = inMemoryRateLimit("create-report", 20, 60);

export const reportRoutes = new Hono<AppEnv>();

reportRoutes.post("/", requireAuth, reportLimiter, async (c) => {
  const user = c.get("user");
  const body = safeParse(createReportSchema, await c.req.json());
  const db = c.get("db");

  const [existing] = await db
    .select({ uid: schema.reports.uid })
    .from(schema.reports)
    .where(
      and(
        eq(schema.reports.reporterUsername, user),
        eq(schema.reports.targetType, body.targetType),
        eq(schema.reports.targetUid, body.targetUid),
      ),
    )
    .limit(1);

  if (existing) {
    throw new ApiError(409, "You have already reported this content");
  }

  const [report] = await db
    .insert(schema.reports)
    .values({
      reporterUsername: user,
      targetType: body.targetType,
      targetUid: body.targetUid,
    })
    .returning({ uid: schema.reports.uid });

  return c.json(report, 201);
});
