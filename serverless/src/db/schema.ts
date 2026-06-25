import {
  boolean,
  integer,
  json,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const users = pgTable("users", {
  username: text("username").primaryKey(),
  password: text("password"),
  email: text("email").notNull(),
  bio: text("bio").default("Wanderer"),
  avatar: text("avatar"),
  answered: integer("answered").default(0),
  posted: integer("posted").default(0),
  verificationToken: text("verification_token"),
  isVerified: boolean("is_verified").default(false),
  links: text("links"),
  resetToken: text("reset_token"),
  resetExpiry: timestamp("reset_expiry", { mode: "date" }),
  dmEnabled: boolean("dm_enabled").default(true).notNull(),
  reputation: integer("reputation").default(0).notNull(),
  badges: json("badges").$type<string[]>().default([]).notNull(),
  newEmail: text("new_email"),
  emailChangeToken: text("email_change_token"),
  emailChangeExpiry: timestamp("email_change_expiry", { mode: "date" }),
  deletedAt: timestamp("deleted_at", { mode: "date" }),
}, (table) => [unique("users_email_key").on(table.email)]);

export const chambers = pgTable("chambers", {
  uid: uuid("uid").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  creatorUsername: text("creator_username").references(() => users.username, {
    onUpdate: "cascade",
  }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  colorIndex: integer("color_index").default(0),
  picture: text("picture"),
}, (table) => [unique("chambers_name_key").on(table.name)]);

export const channels = pgTable("channels", {
  uid: uuid("uid").defaultRandom().primaryKey(),
  chamberUid: uuid("chamber_uid")
    .notNull()
    .references(() => chambers.uid, { onDelete: "cascade" }),
  name: text("name").notNull(),
  icon: text("icon"),
  schema: json("schema").$type<any[]>().default([]).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const chamberMembers = pgTable("chamber_members", {
  chamberUid: uuid("chamber_uid")
    .notNull()
    .references(() => chambers.uid, { onDelete: "cascade" }),
  username: text("username")
    .notNull()
    .references(() => users.username, { onUpdate: "cascade", onDelete: "cascade" }),
  joinedAt: timestamp("joined_at", { mode: "date" }).defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.chamberUid, table.username], name: "chamber_members_pkey" }),
]);

export const posts = pgTable("posts", {
  uid: uuid("uid").defaultRandom().primaryKey(),
  timeCreated: timestamp("time_created", { mode: "date" }).defaultNow(),
  content: text("content"),
  author: text("author")
    .notNull()
    .references(() => users.username, { onUpdate: "cascade", onDelete: "cascade" }),
  chamberUid: uuid("chamber_uid")
    .notNull()
    .references(() => chambers.uid, { onDelete: "cascade" }),
  channelUid: uuid("channel_uid")
    .references(() => channels.uid, { onDelete: "cascade" }),
  upvotesCount: integer("upvotes_count").default(0),
  redditUpvotes: integer("reddit_upvotes").default(0),
  isAnonymous: boolean("is_anonymous").default(false).notNull(),
  acceptedAnswerUid: uuid("accepted_answer_uid"), // Will reference replies.uid in relations
  pinnedAt: timestamp("pinned_at", { mode: "date" }),
  expiresAt: timestamp("expires_at", { mode: "date" }),

  // Custom metadata elements JSON
  customFields: json("custom_fields").$type<Record<string, any>>().default({}),

  // Pivot columns (deprecated but kept for compatibility)
  postType: text("post_type").default("qna").notNull(), // 'qna' | 'partner' | 'trade' | 'taxi'
  
  // Partner Finder metadata
  partnerTargetGrade: text("partner_target_grade"),
  partnerWorkstyle: text("partner_workstyle"),
  partnerSlotsNeeded: integer("partner_slots_needed"),
  partnerStatus: text("partner_status").default("open"),

  // Campus Trade metadata
  tradePrice: integer("trade_price"),
  tradeCondition: text("trade_condition"),
  tradeBookIsbn: text("trade_book_isbn"),
  tradeStatus: text("trade_status").default("available"),

  // Taxi sharing metadata
  taxiDeparture: text("taxi_departure"),
  taxiDestination: text("taxi_destination"),
  taxiDatetime: text("taxi_datetime"),
  taxiSeatsAvailable: integer("taxi_seats_available"),
  taxiStatus: text("taxi_status").default("open"),
});

export const replies = pgTable("replies", {
  uid: uuid("uid").defaultRandom().primaryKey(),
  content: text("content").notNull(),
  postUid: uuid("post_uid")
    .notNull()
    .references(() => posts.uid, { onDelete: "cascade" }),
  parentReplyUid: uuid("parent_reply_uid"),
  timeCreated: timestamp("time_created", { mode: "date" }).defaultNow(),
  author: text("author")
    .notNull()
    .references(() => users.username, { onUpdate: "cascade" }),
  upvotesCount: integer("upvotes_count").default(0),
  redditUpvotes: integer("reddit_upvotes").default(0),
  isAnonymous: boolean("is_anonymous").default(false).notNull(),
});

export const postUpvotes = pgTable("post_upvotes", {
  username: text("username")
    .notNull()
    .references(() => users.username, { onUpdate: "cascade", onDelete: "cascade" }),
  postUid: uuid("post_uid")
    .notNull()
    .references(() => posts.uid, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.username, table.postUid], name: "post_upvotes_pkey" }),
]);

export const replyUpvotes = pgTable("reply_upvotes", {
  replyUid: uuid("reply_uid")
    .notNull()
    .references(() => replies.uid, { onDelete: "cascade" }),
  username: text("username")
    .notNull()
    .references(() => users.username, { onUpdate: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.replyUid, table.username], name: "reply_upvotes_pkey" }),
]);

export const notifications = pgTable("notifications", {
  uid: uuid("uid").defaultRandom().primaryKey(),
  userUsername: text("user_username")
    .notNull()
    .references(() => users.username, { onUpdate: "cascade", onDelete: "cascade" }),
  actorUsername: text("actor_username").references(() => users.username, {
    onUpdate: "cascade",
    onDelete: "cascade",
  }),
  type: text("type").notNull(),
  referenceUid: uuid("reference_uid").notNull(),
  isRead: boolean("is_read").default(false),
  actorIsAnonymous: boolean("actor_is_anonymous").default(false).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
}, (table) => [
  unique("notifications_dedupe_unique").on(
    table.userUsername,
    table.actorUsername,
    table.type,
    table.referenceUid,
  ),
]);

export const conversations = pgTable("conversations", {
  uid: uuid("uid").defaultRandom().primaryKey(),
  participantA: text("participant_a")
    .notNull()
    .references(() => users.username, { onUpdate: "cascade", onDelete: "cascade" }),
  participantB: text("participant_b")
    .notNull()
    .references(() => users.username, { onUpdate: "cascade", onDelete: "cascade" }),
  lastMessageAt: timestamp("last_message_at", { mode: "date" }),
  lastMessagePreview: text("last_message_preview"),
  lastMessageSender: text("last_message_sender"),
  participantALastReadAt: timestamp("participant_a_last_read_at", { mode: "date" }),
  participantBLastReadAt: timestamp("participant_b_last_read_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
}, (table) => [
  unique("conversations_participants_key").on(table.participantA, table.participantB),
]);

export const messages = pgTable("messages", {
  uid: uuid("uid").defaultRandom().primaryKey(),
  conversationUid: uuid("conversation_uid")
    .notNull()
    .references(() => conversations.uid, { onDelete: "cascade" }),
  sender: text("sender")
    .notNull()
    .references(() => users.username, { onUpdate: "cascade", onDelete: "cascade" }),
  content: text("content").notNull(),
  timeCreated: timestamp("time_created", { mode: "date" }).defaultNow(),
});

export const polls = pgTable("polls", {
  uid: uuid("uid").defaultRandom().primaryKey(),
  postUid: uuid("post_uid")
    .notNull()
    .references(() => posts.uid, { onDelete: "cascade" }),
  question: text("question").notNull(),
  options: json("options").$type<string[]>().notNull(),
  expiresAt: timestamp("expires_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
  isClosed: boolean("is_closed").default(false),
});

export const pollVotes = pgTable("poll_votes", {
  uid: uuid("uid").defaultRandom().primaryKey(),
  pollUid: uuid("poll_uid")
    .notNull()
    .references(() => polls.uid, { onDelete: "cascade" }),
  optionIndex: integer("option_index").notNull(),
  username: text("username")
    .notNull()
    .references(() => users.username, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
}, (table) => [
  unique("poll_votes_poll_user_unique").on(table.pollUid, table.username),
]);

export const partnerApplications = pgTable("partner_applications", {
  uid: uuid("uid").defaultRandom().primaryKey(),
  postUid: uuid("post_uid")
    .notNull()
    .references(() => posts.uid, { onDelete: "cascade" }),
  applicantUsername: text("applicant_username")
    .notNull()
    .references(() => users.username, { onDelete: "cascade", onUpdate: "cascade" }),
  pitch: text("pitch").notNull(),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export const follows = pgTable("follows", {
  followerUsername: text("follower_username")
    .notNull()
    .references(() => users.username, { onUpdate: "cascade", onDelete: "cascade" }),
  followingUsername: text("following_username")
    .notNull()
    .references(() => users.username, { onUpdate: "cascade", onDelete: "cascade" }),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.followerUsername, table.followingUsername], name: "follows_pkey" }),
]);

export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  username: text("username").references(() => users.username, {
    onUpdate: "cascade",
    onDelete: "set null",
  }),
  event: text("event").notNull(),
  properties: jsonb("properties").$type<Record<string, unknown>>().default({}),
  sessionId: text("session_id"),
  page: text("page"),
  userAgent: text("user_agent"),
  ip: text("ip"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

export const postViews = pgTable("post_views", {
  id: serial("id").primaryKey(),
  postUid: uuid("post_uid")
    .notNull()
    .references(() => posts.uid, { onDelete: "cascade" }),
  username: text("username").references(() => users.username, {
    onUpdate: "cascade",
    onDelete: "set null",
  }),
  viewedAt: timestamp("viewed_at", { mode: "date" }).defaultNow().notNull(),
});

export const userSessions = pgTable("user_sessions", {
  id: serial("id").primaryKey(),
  username: text("username").references(() => users.username, {
    onUpdate: "cascade",
    onDelete: "set null",
  }),
  sessionId: text("session_id").notNull(),
  ip: text("ip"),
  userAgent: text("user_agent"),
  page: text("page"),
  referrer: text("referrer"),
  startedAt: timestamp("started_at", { mode: "date" }).defaultNow().notNull(),
  lastActiveAt: timestamp("last_active_at", { mode: "date" }).defaultNow().notNull(),
  endedAt: timestamp("ended_at", { mode: "date" }),
  duration: integer("duration"),
});

export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  otp: text("otp").notNull(),
  magicLinkToken: text("magic_link_token").notNull().unique(),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).default(sql`now()`).notNull(),
});
