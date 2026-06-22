import { Hono } from "hono";
import { and, desc, eq, sql } from "drizzle-orm";

import { schema } from "../db";
import { ApiError } from "../lib/errors";
import { requireAuth, optionalAuth } from "../middleware/auth";
import { createNotification, notifyMentions } from "../services/notifications";
import {
  ensurePostExists,
  getPostItems,
  getReplies,
  mapPostItem,
} from "../services/questions";
import { parsePagination } from "../lib/utils";
import type { AppEnv } from "../types/app";

export const questionRoutes = new Hono<AppEnv>();

questionRoutes.get("/", optionalAuth, async (c) => {
  const pinnedParam = c.req.query("pinned");
  const pinned = pinnedParam === "true" ? true : pinnedParam === "false" ? false : undefined;

  return c.json(await getPostItems(c.get("db"), c.get("user"), {
    ...parsePagination(c.req.query()),
    sort: c.req.query("sort"),
    filter: c.req.query("filter"),
    chamberUid: c.req.query("chamber_uid"),
    author: c.req.query("author"),
    postType: c.req.query("post_type"),
    pinned,
  }));
});

questionRoutes.post("/", requireAuth, async (c) => {
  const body = (await c.req.json()) as {
    content?: string;
    chamberUid?: string;
    postType?: string;
    ttlHours?: number;
    partnerTargetGrade?: string;
    partnerWorkstyle?: string;
    partnerSlotsNeeded?: number;
    tradePrice?: number;
    tradeCondition?: string;
    tradeBookIsbn?: string;
    taxiDeparture?: string;
    taxiDestination?: string;
    taxiDatetime?: string;
    taxiSeatsAvailable?: number;
  };
  if (!body.chamberUid) {
    throw new ApiError(400, "chamber uid is required");
  }

  const expiresAt = body.ttlHours && body.ttlHours > 0
    ? new Date(Date.now() + body.ttlHours * 60 * 60 * 1000)
    : null;

  const [created] = await c.get("db").insert(schema.posts).values({
    content: body.content ?? "",
    author: c.get("user"),
    chamberUid: body.chamberUid,
    timeCreated: new Date(),
    expiresAt,
    postType: body.postType ?? "qna",
    partnerTargetGrade: body.partnerTargetGrade ?? null,
    partnerWorkstyle: body.partnerWorkstyle ?? null,
    partnerSlotsNeeded: body.partnerSlotsNeeded ?? null,
    tradePrice: body.tradePrice ?? null,
    tradeCondition: body.tradeCondition ?? null,
    tradeBookIsbn: body.tradeBookIsbn ?? null,
    tradeStatus: body.postType === "trade" ? "available" : null,
    taxiDeparture: body.taxiDeparture ?? null,
    taxiDestination: body.taxiDestination ?? null,
    taxiDatetime: body.taxiDatetime ?? null,
    taxiSeatsAvailable: body.taxiSeatsAvailable ?? null,
  }).returning({ uid: schema.posts.uid });

  if (!created) {
    throw new ApiError(500, "failed to create post");
  }

  await notifyMentions(c.get("db"), body.content ?? "", c.get("user"), created.uid, false);
  return c.json({ message: "post created", uid: created.uid }, 201);
});

questionRoutes.get("/search", optionalAuth, async (c) => {
  const { limit, offset } = parsePagination(c.req.query());
  return c.json(await getPostItems(c.get("db"), c.get("user"), {
    limit,
    offset,
    query: c.req.query("q") ?? "",
    postType: c.req.query("post_type"),
  }));
});

questionRoutes.get("/:uid", optionalAuth, async (c) => {
  const uid = c.req.param("uid");
  if (!uid) {
    throw new ApiError(400, "invalid uid");
  }

  const [row] = await c
    .get("db")
    .select({
      uid: schema.posts.uid,
      content: schema.posts.content,
      timeCreated: schema.posts.timeCreated,
      authorUsername: schema.posts.author,
      authorAvatar: sql<string>`coalesce(${schema.users.avatar}, '')`,
      upvotes: schema.posts.upvotesCount,
      isUpvoted: sql<boolean>`exists (
        select 1 from post_upvotes pv
        where pv.post_uid = ${schema.posts.uid}
          and pv.username = ${c.get("user") || ""}
      )`,
      chamberUid: schema.posts.chamberUid,
      chamberName: sql<string>`coalesce(${schema.chambers.name}, '')`,
      acceptedAnswerUid: schema.posts.acceptedAnswerUid,
      pinnedAt: schema.posts.pinnedAt,
      expiresAt: schema.posts.expiresAt,
      postType: schema.posts.postType,
      partnerTargetGrade: schema.posts.partnerTargetGrade,
      partnerWorkstyle: schema.posts.partnerWorkstyle,
      partnerSlotsNeeded: schema.posts.partnerSlotsNeeded,
      tradePrice: schema.posts.tradePrice,
      tradeCondition: schema.posts.tradeCondition,
      tradeBookIsbn: schema.posts.tradeBookIsbn,
      tradeStatus: schema.posts.tradeStatus,
      taxiDeparture: schema.posts.taxiDeparture,
      taxiDestination: schema.posts.taxiDestination,
      taxiDatetime: schema.posts.taxiDatetime,
      taxiSeatsAvailable: schema.posts.taxiSeatsAvailable,
    })
    .from(schema.posts)
    .leftJoin(schema.users, eq(schema.users.username, schema.posts.author))
    .leftJoin(schema.chambers, eq(schema.chambers.uid, schema.posts.chamberUid))
    .where(eq(schema.posts.uid, uid))
    .limit(1);

  if (!row) {
    throw new ApiError(404, "post not found");
  }

  return c.json(mapPostItem(row));
});

questionRoutes.patch("/:uid", requireAuth, async (c) => {
  const body = (await c.req.json()) as {
    content?: string;
    tradeStatus?: string;
    partnerSlotsNeeded?: number;
    tradePrice?: number;
    tradeCondition?: string;
    tradeBookIsbn?: string;
    partnerTargetGrade?: string;
    partnerWorkstyle?: string;
    taxiDeparture?: string;
    taxiDestination?: string;
    taxiDatetime?: string;
    taxiSeatsAvailable?: number;
  };
  const updated = await c.get("db").update(schema.posts).set({
    content: body.content,
    tradeStatus: body.tradeStatus,
    partnerSlotsNeeded: body.partnerSlotsNeeded,
    tradePrice: body.tradePrice,
    tradeCondition: body.tradeCondition,
    tradeBookIsbn: body.tradeBookIsbn,
    partnerTargetGrade: body.partnerTargetGrade,
    partnerWorkstyle: body.partnerWorkstyle,
    taxiDeparture: body.taxiDeparture,
    taxiDestination: body.taxiDestination,
    taxiDatetime: body.taxiDatetime,
    taxiSeatsAvailable: body.taxiSeatsAvailable,
  }).where(
    and(eq(schema.posts.uid, c.req.param("uid")), eq(schema.posts.author, c.get("user"))),
  ).returning({ uid: schema.posts.uid });

  if (!updated.length) {
    throw new ApiError(404, "post not found or unauthorized");
  }

  return c.json({ message: "post updated" });
});

questionRoutes.delete("/:uid", requireAuth, async (c) => {
  const post = await ensurePostExists(c.get("db"), c.req.param("uid"));
  if (post.author !== c.get("user")) {
    throw new ApiError(403, "unauthorized");
  }

  await c.get("db").delete(schema.posts).where(eq(schema.posts.uid, c.req.param("uid")));
  return c.json({ message: "post deleted" });
});

questionRoutes.post("/:uid/votes", requireAuth, async (c) => {
  const uid = c.req.param("uid");
  const currentUser = c.get("user");
  const db = c.get("db");

  const [existingVote] = await db.select().from(schema.postUpvotes).where(
    and(eq(schema.postUpvotes.username, currentUser), eq(schema.postUpvotes.postUid, uid)),
  ).limit(1);

  if (existingVote) {
    await db.delete(schema.postUpvotes).where(
      and(eq(schema.postUpvotes.username, currentUser), eq(schema.postUpvotes.postUid, uid)),
    );
    await db.update(schema.posts).set({
      upvotesCount: sql`greatest(${schema.posts.upvotesCount} - 1, 0)`,
    }).where(eq(schema.posts.uid, uid));
  } else {
    await db.insert(schema.postUpvotes).values({ username: currentUser, postUid: uid });
    await db.update(schema.posts).set({
      upvotesCount: sql`${schema.posts.upvotesCount} + 1`,
    }).where(eq(schema.posts.uid, uid));

    const [post] = await db.select({ author: schema.posts.author }).from(schema.posts).where(eq(schema.posts.uid, uid)).limit(1);
    if (post?.author && post.author !== currentUser) {
      await createNotification(db, {
        userUsername: post.author,
        actorUsername: currentUser,
        type: "upvote_post",
        referenceUid: uid,
      });
    }
  }

  return c.json({ message: "vote updated" });
});

questionRoutes.post("/:uid/pin", requireAuth, async (c) => {
  const [post] = await c.get("db").select({
    creatorUsername: schema.chambers.creatorUsername,
  }).from(schema.posts).innerJoin(schema.chambers, eq(schema.chambers.uid, schema.posts.chamberUid)).where(eq(schema.posts.uid, c.req.param("uid"))).limit(1);

  if (!post) {
    throw new ApiError(404, "post not found");
  }
  if (post.creatorUsername !== c.get("user")) {
    throw new ApiError(403, "unauthorized");
  }

  await c.get("db").update(schema.posts).set({ pinnedAt: new Date() }).where(eq(schema.posts.uid, c.req.param("uid")));
  return c.json({ message: "post pinned" });
});

questionRoutes.delete("/:uid/pin", requireAuth, async (c) => {
  const [post] = await c.get("db").select({
    creatorUsername: schema.chambers.creatorUsername,
  }).from(schema.posts).innerJoin(schema.chambers, eq(schema.chambers.uid, schema.posts.chamberUid)).where(eq(schema.posts.uid, c.req.param("uid"))).limit(1);

  if (!post) {
    throw new ApiError(404, "post not found");
  }
  if (post.creatorUsername !== c.get("user")) {
    throw new ApiError(403, "unauthorized");
  }

  await c.get("db").update(schema.posts).set({ pinnedAt: null }).where(eq(schema.posts.uid, c.req.param("uid")));
  return c.json({ message: "post unpinned" });
});

questionRoutes.get("/:uid/replies", optionalAuth, async (c) => c.json(await getReplies(c.get("db"), c.get("user"), c.req.param("uid"))));

questionRoutes.post("/:uid/replies", requireAuth, async (c) => {
  const body = (await c.req.json()) as { content?: string };
  const uid = c.req.param("uid");
  const currentUser = c.get("user");
  const db = c.get("db");

  const [created] = await db.insert(schema.replies).values({
    content: body.content ?? "",
    postUid: uid,
    author: currentUser,
    timeCreated: new Date(),
  }).returning({ uid: schema.replies.uid, timeCreated: schema.replies.timeCreated });

  const [post] = await db.select({ author: schema.posts.author }).from(schema.posts).where(eq(schema.posts.uid, uid)).limit(1);
  if (post?.author && post.author !== currentUser) {
    await createNotification(db, {
      userUsername: post.author,
      actorUsername: currentUser,
      type: "reply_post",
      referenceUid: created.uid,
    });
  }

  await notifyMentions(db, body.content ?? "", currentUser, created.uid, true, post?.author);

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

questionRoutes.patch("/:uid/replies/:ruid", requireAuth, async (c) => {
  const body = (await c.req.json()) as { content?: string };
  const updated = await c.get("db").update(schema.replies).set({ content: body.content ?? "" }).where(
    and(eq(schema.replies.uid, c.req.param("ruid")), eq(schema.replies.author, c.get("user"))),
  ).returning({ uid: schema.replies.uid });

  if (!updated.length) {
    throw new ApiError(404, "reply not found or unauthorized");
  }

  return c.json({ message: "reply updated" });
});

questionRoutes.delete("/:uid/replies/:ruid", requireAuth, async (c) => {
  await c.get("db").delete(schema.replies).where(
    and(
      eq(schema.replies.uid, c.req.param("ruid")),
      eq(schema.replies.postUid, c.req.param("uid")),
      eq(schema.replies.author, c.get("user")),
    ),
  );
  return c.json({ message: "reply deleted" });
});

questionRoutes.post("/:uid/replies/:ruid/votes", requireAuth, async (c) => {
  const db = c.get("db");
  const currentUser = c.get("user");
  const ruid = c.req.param("ruid");

  const [existingVote] = await db.select().from(schema.replyUpvotes).where(
    and(eq(schema.replyUpvotes.username, currentUser), eq(schema.replyUpvotes.replyUid, ruid)),
  ).limit(1);

  if (existingVote) {
    await db.delete(schema.replyUpvotes).where(
      and(eq(schema.replyUpvotes.username, currentUser), eq(schema.replyUpvotes.replyUid, ruid)),
    );
    await db.update(schema.replies).set({
      upvotesCount: sql`greatest(${schema.replies.upvotesCount} - 1, 0)`,
    }).where(eq(schema.replies.uid, ruid));
  } else {
    await db.insert(schema.replyUpvotes).values({ username: currentUser, replyUid: ruid });
    await db.update(schema.replies).set({
      upvotesCount: sql`${schema.replies.upvotesCount} + 1`,
    }).where(eq(schema.replies.uid, ruid));

    const [reply] = await db.select({ author: schema.replies.author }).from(schema.replies).where(eq(schema.replies.uid, ruid)).limit(1);
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

questionRoutes.post("/:uid/replies/:ruid/accept", requireAuth, async (c) => {
  const uid = c.req.param("uid");
  const ruid = c.req.param("ruid");
  const post = await ensurePostExists(c.get("db"), uid);
  if (post.author !== c.get("user")) {
    throw new ApiError(403, "unauthorized");
  }

  const updated = await c.get("db").update(schema.posts).set({ acceptedAnswerUid: ruid }).where(
    and(
      eq(schema.posts.uid, uid),
      sql`exists (
        select 1 from ${schema.replies} r
        where r.uid = ${ruid} and r.post_uid = ${schema.posts.uid}
      )`,
    ),
  ).returning({ uid: schema.posts.uid });

  if (!updated.length) {
    throw new ApiError(404, "reply not found");
  }

  return c.json({ message: "reply accepted" });
});

questionRoutes.delete("/:uid/replies/:ruid/accept", requireAuth, async (c) => {
  const uid = c.req.param("uid");
  const ruid = c.req.param("ruid");
  const post = await ensurePostExists(c.get("db"), uid);
  if (post.author !== c.get("user")) {
    throw new ApiError(403, "unauthorized");
  }

  const updated = await c.get("db").update(schema.posts).set({ acceptedAnswerUid: null }).where(
    and(eq(schema.posts.uid, uid), eq(schema.posts.acceptedAnswerUid, ruid)),
  ).returning({ uid: schema.posts.uid });

  if (!updated.length) {
    throw new ApiError(404, "reply not found");
  }

  return c.json({ message: "reply unaccepted" });
});

// Partner application routes
questionRoutes.post("/:uid/apply", requireAuth, async (c) => {
  const postUid = c.req.param("uid");
  const applicantUsername = c.get("user");
  const body = (await c.req.json()) as { pitch?: string };

  if (!body.pitch) {
    throw new ApiError(400, "pitch is required");
  }

  await ensurePostExists(c.get("db"), postUid);

  const [application] = await c.get("db").insert(schema.partnerApplications).values({
    postUid,
    applicantUsername,
    pitch: body.pitch,
    status: "pending",
  }).returning({ uid: schema.partnerApplications.uid });

  // Notify post author
  const [post] = await c.get("db").select({ author: schema.posts.author }).from(schema.posts).where(eq(schema.posts.uid, postUid)).limit(1);
  if (post?.author && post.author !== applicantUsername) {
    await createNotification(c.get("db"), {
      userUsername: post.author,
      actorUsername: applicantUsername,
      type: "partner_application",
      referenceUid: application.uid,
    });
  }

  return c.json({ message: "application submitted", uid: application.uid }, 201);
});

questionRoutes.get("/:uid/applications", requireAuth, async (c) => {
  const postUid = c.req.param("uid");
  const currentUser = c.get("user");
  const db = c.get("db");

  const post = await ensurePostExists(db, postUid);
  if (post.author !== currentUser) {
    throw new ApiError(403, "unauthorized");
  }

  const apps = await db
    .select({
      uid: schema.partnerApplications.uid,
      postUid: schema.partnerApplications.postUid,
      applicantUsername: schema.partnerApplications.applicantUsername,
      applicantAvatar: sql<string>`coalesce(${schema.users.avatar}, '')`,
      pitch: schema.partnerApplications.pitch,
      status: schema.partnerApplications.status,
      createdAt: schema.partnerApplications.createdAt,
    })
    .from(schema.partnerApplications)
    .leftJoin(schema.users, eq(schema.users.username, schema.partnerApplications.applicantUsername))
    .where(eq(schema.partnerApplications.postUid, postUid))
    .orderBy(desc(schema.partnerApplications.createdAt));

  return c.json(apps);
});

questionRoutes.patch("/:uid/applications/:appUid", requireAuth, async (c) => {
  const postUid = c.req.param("uid");
  const appUid = c.req.param("appUid");
  const currentUser = c.get("user");
  const body = (await c.req.json()) as { status?: string };
  const db = c.get("db");

  if (!body.status || !["accepted", "declined"].includes(body.status)) {
    throw new ApiError(400, "invalid status");
  }

  const post = await ensurePostExists(db, postUid);
  if (post.author !== currentUser) {
    throw new ApiError(403, "unauthorized");
  }

  const updated = await db.update(schema.partnerApplications).set({
    status: body.status,
  }).where(
    and(
      eq(schema.partnerApplications.uid, appUid),
      eq(schema.partnerApplications.postUid, postUid),
    ),
  ).returning({ uid: schema.partnerApplications.uid, applicantUsername: schema.partnerApplications.applicantUsername });

  if (!updated.length) {
    throw new ApiError(404, "application not found");
  }

  // Notify applicant
  await createNotification(db, {
    userUsername: updated[0].applicantUsername,
    actorUsername: currentUser,
    type: `partner_${body.status}`,
    referenceUid: appUid,
  });

  return c.json({ message: `application ${body.status}` });
});
