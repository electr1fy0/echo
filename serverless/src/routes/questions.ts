import { Hono } from "hono";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";

import { schema } from "../db";
import { ApiError } from "../lib/errors";
import { requireAuth, optionalAuth } from "../middleware/auth";
import { createNotification, notifyMentions } from "../services/notifications";
import { trackEvent } from "../services/analytics";
import { recomputeReputation } from "../services/users";
import {
  ensurePostExists,
  getPostItems,
  getReplies,
  mapPostItem,
} from "../services/questions";
import { parsePagination, countWords, MAX_POST_WORDS } from "../lib/utils";
import { safeParse, createPostSchema, updatePostSchema, createReplySchema, updateReplySchema, pollVoteSchema, partnerApplySchema, updateApplicationSchema } from "../lib/validation";
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
    channelUid: c.req.query("channel_uid"),
    channelName: c.req.query("channel_name"),
    author: c.req.query("author"),
    postType: c.req.query("post_type"),
    pinned,
    query: c.req.query("q"),
  }));
});

questionRoutes.post("/", requireAuth, async (c) => {
  const body = safeParse(createPostSchema, await c.req.json());

  if (body.content && countWords(body.content) > MAX_POST_WORDS) {
    throw new ApiError(400, `post content exceeds ${MAX_POST_WORDS} word limit`);
  }

  let channelUid = body.channelUid;
  if (!channelUid) {
    const [discChannel] = await c.get("db")
      .select({ uid: schema.channels.uid })
      .from(schema.channels)
      .where(
        and(
          eq(schema.channels.chamberUid, body.chamberUid),
          or(
            eq(schema.channels.name, "discussion"),
            eq(schema.channels.name, "discussions")
          )
        )
      )
      .limit(1);
    if (discChannel) {
      channelUid = discChannel.uid;
    }
  }

  const expiresAt = body.ttlHours && body.ttlHours > 0
    ? new Date(Date.now() + body.ttlHours * 60 * 60 * 1000)
    : null;

  const [created] = await c.get("db").insert(schema.posts).values({
    content: body.content ?? "",
    author: c.get("user"),
    chamberUid: body.chamberUid,
    channelUid: channelUid ?? null,
    customFields: body.customFields ?? {},
    timeCreated: new Date(),
    expiresAt,
    postType: body.postType ?? "qna",
    isAnonymous: body.isAnonymous ?? false,
    partnerTargetGrade: body.partnerTargetGrade ?? null,
    partnerWorkstyle: body.partnerWorkstyle ?? null,
    partnerSlotsNeeded: body.partnerSlotsNeeded ?? null,
    partnerStatus: body.postType === "partner" ? "open" : null,
    tradePrice: body.tradePrice ?? null,
    tradeCondition: body.tradeCondition ?? null,
    tradeBookIsbn: body.tradeBookIsbn ?? null,
    tradeStatus: body.postType === "trade" ? "available" : null,
    taxiDeparture: body.taxiDeparture ?? null,
    taxiDestination: body.taxiDestination ?? null,
    taxiDatetime: body.taxiDatetime ?? null,
    taxiSeatsAvailable: body.taxiSeatsAvailable ?? null,
    taxiStatus: body.postType === "taxi" ? "open" : null,
  }).returning({ uid: schema.posts.uid });

  if (!created) {
    throw new ApiError(500, "failed to create post");
  }

  // Create poll if postType is "poll"
  if (body.postType === "poll" && body.pollQuestion && body.pollOptions && body.pollOptions.length >= 2) {
    await c.get("db").insert(schema.polls).values({
      postUid: created.uid,
      question: body.pollQuestion,
      options: body.pollOptions,
      expiresAt,
    });
  }

  await notifyMentions(c.get("db"), body.content ?? "", c.get("user"), created.uid, false, undefined, body.isAnonymous ?? false);
  await recomputeReputation(c.get("db"), c.get("user"));
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
      authorBio: schema.users.bio,
      authorPosted: schema.users.posted,
      authorAnswered: schema.users.answered,
      authorReputation: sql<number>`coalesce(${schema.users.reputation}, 0)`,
      isAnonymous: schema.posts.isAnonymous,
      upvotes: schema.posts.upvotesCount,
      isUpvoted: sql<boolean>`exists (
        select 1 from post_upvotes pv
        where pv.post_uid = ${schema.posts.uid}
          and pv.username = ${c.get("user") || ""}
      )`,
      chamberUid: schema.posts.chamberUid,
      chamberName: sql<string>`coalesce(${schema.chambers.name}, '')`,
      channelUid: schema.posts.channelUid,
      channelSchema: schema.channels.schema,
      customFields: schema.posts.customFields,
      acceptedAnswerUid: schema.posts.acceptedAnswerUid,
      pinnedAt: schema.posts.pinnedAt,
      expiresAt: schema.posts.expiresAt,
      postType: schema.posts.postType,
      partnerTargetGrade: schema.posts.partnerTargetGrade,
      partnerWorkstyle: schema.posts.partnerWorkstyle,
      partnerSlotsNeeded: schema.posts.partnerSlotsNeeded,
      partnerStatus: schema.posts.partnerStatus,
      tradePrice: schema.posts.tradePrice,
      tradeCondition: schema.posts.tradeCondition,
      tradeBookIsbn: schema.posts.tradeBookIsbn,
      tradeStatus: schema.posts.tradeStatus,
      taxiDeparture: schema.posts.taxiDeparture,
      taxiDestination: schema.posts.taxiDestination,
      taxiDatetime: schema.posts.taxiDatetime,
      taxiSeatsAvailable: schema.posts.taxiSeatsAvailable,
      taxiStatus: schema.posts.taxiStatus,
      pollUid: schema.polls.uid,
      pollQuestion: schema.polls.question,
      pollOptions: schema.polls.options,
      pollExpiresAt: schema.polls.expiresAt,
      pollIsClosed: schema.polls.isClosed,
      pollVotes: sql<{ optionIndex: number; count: number }[]>`COALESCE(
        (
          SELECT json_agg(json_build_object('optionIndex', pv.option_index, 'count', pv.cnt) ORDER BY pv.option_index)
          FROM (
            SELECT pv2.option_index, COUNT(*)::int as cnt
            FROM poll_votes pv2
            WHERE pv2.poll_uid = ${schema.polls.uid}
            GROUP BY pv2.option_index
          ) pv
        ),
        '[]'::json
      )`,
      userPollVote: sql<number | null>`(
        SELECT pv3.option_index
        FROM poll_votes pv3
        WHERE pv3.poll_uid = ${schema.polls.uid}
          AND pv3.username = ${c.get("user") || ""}
        LIMIT 1
      )`,
      repliesCount: sql<number>`(
        select count(*)::int from replies r
        where r.post_uid = ${schema.posts.uid}
      )`,
    })
    .from(schema.posts)
    .leftJoin(schema.users, eq(schema.users.username, schema.posts.author))
    .leftJoin(schema.chambers, eq(schema.chambers.uid, schema.posts.chamberUid))
    .leftJoin(schema.channels, eq(schema.channels.uid, schema.posts.channelUid))
    .leftJoin(schema.polls, eq(schema.polls.postUid, schema.posts.uid))
    .where(eq(schema.posts.uid, uid))
    .limit(1);

  if (!row) {
    throw new ApiError(404, "post not found");
  }

  return c.json(mapPostItem(row));
});

questionRoutes.patch("/:uid", requireAuth, async (c) => {
  const body = safeParse(updatePostSchema, await c.req.json());
  if (body.content !== undefined && countWords(body.content) > MAX_POST_WORDS) {
    throw new ApiError(400, `post content exceeds ${MAX_POST_WORDS} word limit`);
  }
  const updateData: Record<string, any> = {};
  if (body.content !== undefined) updateData.content = body.content;
  if (body.customFields !== undefined) updateData.customFields = body.customFields;
  if (body.tradeStatus !== undefined) updateData.tradeStatus = body.tradeStatus;
  if (body.partnerSlotsNeeded !== undefined) updateData.partnerSlotsNeeded = body.partnerSlotsNeeded;
  if (body.partnerStatus !== undefined) updateData.partnerStatus = body.partnerStatus;
  if (body.tradePrice !== undefined) updateData.tradePrice = body.tradePrice;
  if (body.tradeCondition !== undefined) updateData.tradeCondition = body.tradeCondition;
  if (body.tradeBookIsbn !== undefined) updateData.tradeBookIsbn = body.tradeBookIsbn;
  if (body.partnerTargetGrade !== undefined) updateData.partnerTargetGrade = body.partnerTargetGrade;
  if (body.partnerWorkstyle !== undefined) updateData.partnerWorkstyle = body.partnerWorkstyle;
  if (body.taxiDeparture !== undefined) updateData.taxiDeparture = body.taxiDeparture;
  if (body.taxiDestination !== undefined) updateData.taxiDestination = body.taxiDestination;
  if (body.taxiDatetime !== undefined) updateData.taxiDatetime = body.taxiDatetime;
  if (body.taxiSeatsAvailable !== undefined) updateData.taxiSeatsAvailable = body.taxiSeatsAvailable;
  if (body.taxiStatus !== undefined) updateData.taxiStatus = body.taxiStatus;

  const updated = await c.get("db").update(schema.posts).set(updateData).where(
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

  const db = c.get("db");
  await db.delete(schema.notifications).where(
    or(
      eq(schema.notifications.referenceUid, c.req.param("uid")),
      inArray(
        schema.notifications.referenceUid,
        db.select({ uid: schema.replies.uid }).from(schema.replies).where(eq(schema.replies.postUid, c.req.param("uid"))),
      ),
    ),
  );
  await db.delete(schema.posts).where(eq(schema.posts.uid, c.req.param("uid")));
  await recomputeReputation(db, c.get("user"));
  return c.json({ message: "post deleted" });
});

questionRoutes.post("/:uid/votes", requireAuth, async (c) => {
  const uid = c.req.param("uid");
  const currentUser = c.get("user");
  const db = c.get("db");

  const [existingVote] = await db.select().from(schema.postUpvotes).where(
    and(eq(schema.postUpvotes.username, currentUser), eq(schema.postUpvotes.postUid, uid)),
  ).limit(1);

  const [post] = await db.select({ author: schema.posts.author }).from(schema.posts).where(eq(schema.posts.uid, uid)).limit(1);

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

    if (post?.author && post.author !== currentUser) {
      await createNotification(db, {
        userUsername: post.author,
        actorUsername: currentUser,
        type: "upvote_post",
        referenceUid: uid,
      });
      await trackEvent(db, {
        username: post.author,
        event: "upvote_received",
        properties: { postUid: uid, by: currentUser },
      });
    }
  }

  if (post?.author) {
    await recomputeReputation(db, post.author);
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
  const body = safeParse(createReplySchema, await c.req.json());
  const uid = c.req.param("uid");
  const currentUser = c.get("user");
  const db = c.get("db");

  const [created] = await db.insert(schema.replies).values({
    content: body.content,
    postUid: uid,
    parentReplyUid: body.parentReplyUid ?? null,
    author: currentUser,
    timeCreated: new Date(),
    isAnonymous: body.isAnonymous ?? false,
  }).returning({ uid: schema.replies.uid, timeCreated: schema.replies.timeCreated });

  const [post] = await db.select({ author: schema.posts.author }).from(schema.posts).where(eq(schema.posts.uid, uid)).limit(1);
  if (post?.author && post.author !== currentUser) {
    await createNotification(db, {
      userUsername: post.author,
      actorUsername: currentUser,
      type: "reply_post",
      referenceUid: created.uid,
      actorIsAnonymous: body.isAnonymous ?? false,
    });
  }

  await notifyMentions(db, body.content ?? "", currentUser, created.uid, true, post?.author, body.isAnonymous ?? false);
  await recomputeReputation(db, currentUser);

  return c.json({
    uid: created.uid,
    content: body.content ?? "",
    questionUid: uid,
    parentReplyUid: body.parentReplyUid ?? undefined,
    timeCreated: created.timeCreated?.toISOString() ?? null,
    authorUsername: currentUser,
    upvotes: 0,
    isUpvoted: false,
    isAccepted: false,
    isAnonymous: body.isAnonymous ?? false,
  }, 201);
});

questionRoutes.patch("/:uid/replies/:ruid", requireAuth, async (c) => {
  const body = safeParse(updateReplySchema, await c.req.json());
  const updated = await c.get("db").update(schema.replies).set({ content: body.content }).where(
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
  await recomputeReputation(c.get("db"), c.get("user"));
  return c.json({ message: "reply deleted" });
});

questionRoutes.post("/:uid/replies/:ruid/votes", requireAuth, async (c) => {
  const db = c.get("db");
  const currentUser = c.get("user");
  const ruid = c.req.param("ruid");

  const [existingVote] = await db.select().from(schema.replyUpvotes).where(
    and(eq(schema.replyUpvotes.username, currentUser), eq(schema.replyUpvotes.replyUid, ruid)),
  ).limit(1);

  const [reply] = await db.select({ author: schema.replies.author }).from(schema.replies).where(eq(schema.replies.uid, ruid)).limit(1);

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

    if (reply?.author && reply.author !== currentUser) {
      await createNotification(db, {
        userUsername: reply.author,
        actorUsername: currentUser,
        type: "upvote_reply",
        referenceUid: ruid,
      });
      await trackEvent(db, {
        username: reply.author,
        event: "upvote_received",
        properties: { replyUid: ruid, by: currentUser },
      });
    }
  }

  if (reply?.author) {
    await recomputeReputation(db, reply.author);
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

  const [replyToAccept] = await c.get("db").select({ author: schema.replies.author }).from(schema.replies).where(eq(schema.replies.uid, ruid)).limit(1);

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

  if (replyToAccept?.author) {
    await recomputeReputation(c.get("db"), replyToAccept.author);
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

  const [replyToUnaccept] = await c.get("db").select({ author: schema.replies.author }).from(schema.replies).where(eq(schema.replies.uid, ruid)).limit(1);

  const updated = await c.get("db").update(schema.posts).set({ acceptedAnswerUid: null }).where(
    and(eq(schema.posts.uid, uid), eq(schema.posts.acceptedAnswerUid, ruid)),
  ).returning({ uid: schema.posts.uid });

  if (!updated.length) {
    throw new ApiError(404, "reply not found");
  }

  if (replyToUnaccept?.author) {
    await recomputeReputation(c.get("db"), replyToUnaccept.author);
  }

  return c.json({ message: "reply unaccepted" });
});

// Poll vote route
questionRoutes.post("/:uid/poll/vote", requireAuth, async (c) => {
  const uid = c.req.param("uid");
  const currentUser = c.get("user");
  const db = c.get("db");
  const body = safeParse(pollVoteSchema, await c.req.json());

  const [poll] = await db.select({
    uid: schema.polls.uid,
    options: schema.polls.options,
    isClosed: schema.polls.isClosed,
    expiresAt: schema.polls.expiresAt,
  }).from(schema.polls).where(eq(schema.polls.postUid, uid)).limit(1);

  if (!poll) {
    throw new ApiError(404, "poll not found");
  }

  if (poll.isClosed) {
    throw new ApiError(400, "poll is closed");
  }

  // Auto-close if expired
  if (!poll.isClosed && poll.expiresAt && new Date() > new Date(poll.expiresAt)) {
    await db.update(schema.polls).set({ isClosed: true }).where(eq(schema.polls.uid, poll.uid));
    throw new ApiError(400, "poll has expired");
  }

  if (body.optionIndex >= poll.options.length) {
    throw new ApiError(400, "invalid option");
  }

  // Check if user already voted
  const [existingVote] = await db.select().from(schema.pollVotes).where(
    and(
      eq(schema.pollVotes.pollUid, poll.uid),
      eq(schema.pollVotes.username, currentUser),
    ),
  ).limit(1);

  if (existingVote) {
    if (existingVote.optionIndex === body.optionIndex) {
      // Remove vote
      await db.delete(schema.pollVotes).where(
        and(
          eq(schema.pollVotes.pollUid, poll.uid),
          eq(schema.pollVotes.username, currentUser),
        ),
      );
    } else {
      // Change vote
      await db.update(schema.pollVotes).set({ optionIndex: body.optionIndex }).where(
        and(
          eq(schema.pollVotes.pollUid, poll.uid),
          eq(schema.pollVotes.username, currentUser),
        ),
      );
    }
  } else {
    await db.insert(schema.pollVotes).values({
      pollUid: poll.uid,
      optionIndex: body.optionIndex,
      username: currentUser,
    });
  }

  return c.json({ message: "vote updated" });
});

// Partner application routes
questionRoutes.post("/:uid/apply", requireAuth, async (c) => {
  const postUid = c.req.param("uid");
  const applicantUsername = c.get("user");
  const body = safeParse(partnerApplySchema, await c.req.json());

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
  const body = safeParse(updateApplicationSchema, await c.req.json());
  const db = c.get("db");

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
