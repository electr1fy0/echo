import { Hono } from "hono";
import { and, desc, eq, sql } from "drizzle-orm";

import { schema } from "../db";
import { ApiError } from "../lib/errors";
import { requireAuth } from "../middleware/auth";
import { createNotification, notifyMentions } from "../services/notifications";
import {
  ensureQuestionExists,
  getQuestionItems,
  getReplies,
  mapQuestionItem,
} from "../services/questions";
import { parsePagination } from "../lib/utils";
import type { AppEnv } from "../types/app";

export const questionRoutes = new Hono<AppEnv>();

questionRoutes.use("*", requireAuth);

questionRoutes.get("/", async (c) => {
  return c.json(await getQuestionItems(c.get("db"), c.get("user"), {
    ...parsePagination(c.req.query()),
    sort: c.req.query("sort"),
    filter: c.req.query("filter"),
    chamberUid: c.req.query("chamber_uid"),
    author: c.req.query("author"),
  }));
});

questionRoutes.post("/", async (c) => {
  const body = (await c.req.json()) as { content?: string; chamberUid?: string };
  if (!body.chamberUid) {
    throw new ApiError(400, "chamber uid is required");
  }

  const [created] = await c.get("db").insert(schema.questions).values({
    content: body.content ?? "",
    author: c.get("user"),
    chamberUid: body.chamberUid,
    timeCreated: new Date(),
  }).returning({ uid: schema.questions.uid });

  if (!created) {
    throw new ApiError(500, "failed to create question");
  }

  await notifyMentions(c.get("db"), body.content ?? "", c.get("user"), created.uid, false);
  return c.json({ message: "question created" }, 201);
});

questionRoutes.get("/search", async (c) => {
  const { limit, offset } = parsePagination(c.req.query());
  return c.json(await getQuestionItems(c.get("db"), c.get("user"), {
    limit,
    offset,
    query: c.req.query("q") ?? "",
  }));
});

questionRoutes.get("/:uid", async (c) => {
  const uid = c.req.param("uid");
  if (!uid) {
    throw new ApiError(400, "invalid uid");
  }

  const [row] = await c
    .get("db")
    .select({
      uid: schema.questions.uid,
      content: schema.questions.content,
      timeCreated: schema.questions.timeCreated,
      authorUsername: schema.questions.author,
      authorAvatar: sql<string>`coalesce(${schema.users.avatar}, '')`,
      upvotes: schema.questions.upvotesCount,
      isUpvoted: sql<boolean>`exists (
        select 1 from question_upvotes qv
        where qv.question_uid = ${schema.questions.uid}
          and qv.username = ${c.get("user")}
      )`,
      chamberUid: schema.questions.chamberUid,
      chamberName: sql<string>`coalesce(${schema.chambers.name}, '')`,
      acceptedAnswerUid: schema.questions.acceptedAnswerUid,
      pinnedAt: schema.questions.pinnedAt,
    })
    .from(schema.questions)
    .leftJoin(schema.users, eq(schema.users.username, schema.questions.author))
    .leftJoin(schema.chambers, eq(schema.chambers.uid, schema.questions.chamberUid))
    .where(eq(schema.questions.uid, uid))
    .limit(1);

  if (!row) {
    throw new ApiError(404, "question not found");
  }

  return c.json(mapQuestionItem(row));
});

questionRoutes.patch("/:uid", async (c) => {
  const body = (await c.req.json()) as { content?: string };
  const updated = await c.get("db").update(schema.questions).set({ content: body.content ?? "" }).where(
    and(eq(schema.questions.uid, c.req.param("uid")), eq(schema.questions.author, c.get("user"))),
  ).returning({ uid: schema.questions.uid });

  if (!updated.length) {
    throw new ApiError(404, "question not found or unauthorized");
  }

  return c.json({ message: "question updated" });
});

questionRoutes.delete("/:uid", async (c) => {
  const question = await ensureQuestionExists(c.get("db"), c.req.param("uid"));
  if (question.author !== c.get("user")) {
    throw new ApiError(403, "unauthorized");
  }

  await c.get("db").delete(schema.questions).where(eq(schema.questions.uid, c.req.param("uid")));
  return c.json({ message: "question deleted" });
});

questionRoutes.post("/:uid/votes", async (c) => {
  const uid = c.req.param("uid");
  const currentUser = c.get("user");
  const db = c.get("db");

  const [existingVote] = await db.select().from(schema.questionUpvotes).where(
    and(eq(schema.questionUpvotes.username, currentUser), eq(schema.questionUpvotes.questionUid, uid)),
  ).limit(1);

  if (existingVote) {
    await db.delete(schema.questionUpvotes).where(
      and(eq(schema.questionUpvotes.username, currentUser), eq(schema.questionUpvotes.questionUid, uid)),
    );
    await db.update(schema.questions).set({
      upvotesCount: sql`greatest(${schema.questions.upvotesCount} - 1, 0)`,
    }).where(eq(schema.questions.uid, uid));
  } else {
    await db.insert(schema.questionUpvotes).values({ username: currentUser, questionUid: uid });
    await db.update(schema.questions).set({
      upvotesCount: sql`${schema.questions.upvotesCount} + 1`,
    }).where(eq(schema.questions.uid, uid));

    const [question] = await db.select({ author: schema.questions.author }).from(schema.questions).where(eq(schema.questions.uid, uid)).limit(1);
    if (question?.author && question.author !== currentUser) {
      await createNotification(db, {
        userUsername: question.author,
        actorUsername: currentUser,
        type: "upvote_question",
        referenceUid: uid,
      });
    }
  }

  return c.json({ message: "vote updated" });
});

questionRoutes.post("/:uid/pin", async (c) => {
  const [question] = await c.get("db").select({
    creatorUsername: schema.chambers.creatorUsername,
  }).from(schema.questions).innerJoin(schema.chambers, eq(schema.chambers.uid, schema.questions.chamberUid)).where(eq(schema.questions.uid, c.req.param("uid"))).limit(1);

  if (!question) {
    throw new ApiError(404, "question not found");
  }
  if (question.creatorUsername !== c.get("user")) {
    throw new ApiError(403, "unauthorized");
  }

  await c.get("db").update(schema.questions).set({ pinnedAt: new Date() }).where(eq(schema.questions.uid, c.req.param("uid")));
  return c.json({ message: "question pinned" });
});

questionRoutes.delete("/:uid/pin", async (c) => {
  const [question] = await c.get("db").select({
    creatorUsername: schema.chambers.creatorUsername,
  }).from(schema.questions).innerJoin(schema.chambers, eq(schema.chambers.uid, schema.questions.chamberUid)).where(eq(schema.questions.uid, c.req.param("uid"))).limit(1);

  if (!question) {
    throw new ApiError(404, "question not found");
  }
  if (question.creatorUsername !== c.get("user")) {
    throw new ApiError(403, "unauthorized");
  }

  await c.get("db").update(schema.questions).set({ pinnedAt: null }).where(eq(schema.questions.uid, c.req.param("uid")));
  return c.json({ message: "question unpinned" });
});

questionRoutes.get("/:uid/replies", async (c) => c.json(await getReplies(c.get("db"), c.get("user"), c.req.param("uid"))));

questionRoutes.post("/:uid/replies", async (c) => {
  const body = (await c.req.json()) as { content?: string };
  const uid = c.req.param("uid");
  const currentUser = c.get("user");
  const db = c.get("db");

  const [created] = await db.insert(schema.answers).values({
    content: body.content ?? "",
    questionUid: uid,
    author: currentUser,
    timeCreated: new Date(),
  }).returning({ uid: schema.answers.uid, timeCreated: schema.answers.timeCreated });

  const [question] = await db.select({ author: schema.questions.author }).from(schema.questions).where(eq(schema.questions.uid, uid)).limit(1);
  if (question?.author && question.author !== currentUser) {
    await createNotification(db, {
      userUsername: question.author,
      actorUsername: currentUser,
      type: "reply_question",
      referenceUid: created.uid,
    });
  }

  await notifyMentions(db, body.content ?? "", currentUser, created.uid, true, question?.author);

  return c.json({
    uid: created.uid,
    content: body.content ?? "",
    questionUid: uid,
    timeCreated: created.timeCreated?.toISOString() ?? null,
    authorUsername: currentUser,
    upvotes: 0,
    isUpvoted: false,
    isAccepted: false,
  }, 201);
});

questionRoutes.patch("/:uid/replies/:ruid", async (c) => {
  const body = (await c.req.json()) as { content?: string };
  const updated = await c.get("db").update(schema.answers).set({ content: body.content ?? "" }).where(
    and(eq(schema.answers.uid, c.req.param("ruid")), eq(schema.answers.author, c.get("user"))),
  ).returning({ uid: schema.answers.uid });

  if (!updated.length) {
    throw new ApiError(404, "reply not found or unauthorized");
  }

  return c.json({ message: "reply updated" });
});

questionRoutes.delete("/:uid/replies/:ruid", async (c) => {
  await c.get("db").delete(schema.answers).where(
    and(
      eq(schema.answers.uid, c.req.param("ruid")),
      eq(schema.answers.questionUid, c.req.param("uid")),
      eq(schema.answers.author, c.get("user")),
    ),
  );
  return c.json({ message: "reply deleted" });
});

questionRoutes.post("/:uid/replies/:ruid/votes", async (c) => {
  const db = c.get("db");
  const currentUser = c.get("user");
  const ruid = c.req.param("ruid");

  const [existingVote] = await db.select().from(schema.answerUpvotes).where(
    and(eq(schema.answerUpvotes.username, currentUser), eq(schema.answerUpvotes.answerUid, ruid)),
  ).limit(1);

  if (existingVote) {
    await db.delete(schema.answerUpvotes).where(
      and(eq(schema.answerUpvotes.username, currentUser), eq(schema.answerUpvotes.answerUid, ruid)),
    );
    await db.update(schema.answers).set({
      upvotesCount: sql`greatest(${schema.answers.upvotesCount} - 1, 0)`,
    }).where(eq(schema.answers.uid, ruid));
  } else {
    await db.insert(schema.answerUpvotes).values({ username: currentUser, answerUid: ruid });
    await db.update(schema.answers).set({
      upvotesCount: sql`${schema.answers.upvotesCount} + 1`,
    }).where(eq(schema.answers.uid, ruid));

    const [reply] = await db.select({ author: schema.answers.author }).from(schema.answers).where(eq(schema.answers.uid, ruid)).limit(1);
    if (reply?.author && reply.author !== currentUser) {
      await createNotification(db, {
        userUsername: reply.author,
        actorUsername: currentUser,
        type: "upvote_reply",
        referenceUid: ruid,
      });
    }
  }

  return c.json({ message: "vote updated" });
});

questionRoutes.post("/:uid/replies/:ruid/accept", async (c) => {
  const uid = c.req.param("uid");
  const ruid = c.req.param("ruid");
  const question = await ensureQuestionExists(c.get("db"), uid);
  if (question.author !== c.get("user")) {
    throw new ApiError(403, "unauthorized");
  }

  const updated = await c.get("db").update(schema.questions).set({ acceptedAnswerUid: ruid }).where(
    and(
      eq(schema.questions.uid, uid),
      sql`exists (
        select 1 from ${schema.answers} a
        where a.uid = ${ruid} and a.question_uid = ${schema.questions.uid}
      )`,
    ),
  ).returning({ uid: schema.questions.uid });

  if (!updated.length) {
    throw new ApiError(404, "reply not found");
  }

  return c.json({ message: "reply accepted" });
});

questionRoutes.delete("/:uid/replies/:ruid/accept", async (c) => {
  const uid = c.req.param("uid");
  const ruid = c.req.param("ruid");
  const question = await ensureQuestionExists(c.get("db"), uid);
  if (question.author !== c.get("user")) {
    throw new ApiError(403, "unauthorized");
  }

  const updated = await c.get("db").update(schema.questions).set({ acceptedAnswerUid: null }).where(
    and(eq(schema.questions.uid, uid), eq(schema.questions.acceptedAnswerUid, ruid)),
  ).returning({ uid: schema.questions.uid });

  if (!updated.length) {
    throw new ApiError(404, "reply not found");
  }

  return c.json({ message: "reply unaccepted" });
});
