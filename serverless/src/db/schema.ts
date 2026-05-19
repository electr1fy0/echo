import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

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
}, (table) => [unique("chambers_name_key").on(table.name)]);

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

export const questions = pgTable("questions", {
  uid: uuid("uid").defaultRandom().primaryKey(),
  timeCreated: timestamp("time_created", { mode: "date" }).defaultNow(),
  content: text("content"),
  author: text("author")
    .notNull()
    .references(() => users.username, { onUpdate: "cascade", onDelete: "cascade" }),
  chamberUid: uuid("chamber_uid")
    .notNull()
    .references(() => chambers.uid, { onDelete: "cascade" }),
  upvotesCount: integer("upvotes_count").default(0),
  redditUpvotes: integer("reddit_upvotes").default(0),
  acceptedAnswerUid: uuid("accepted_answer_uid"),
  pinnedAt: timestamp("pinned_at", { mode: "date" }),
});

export const answers = pgTable("answers", {
  uid: uuid("uid").defaultRandom().primaryKey(),
  content: text("content").notNull(),
  questionUid: uuid("question_uid")
    .notNull()
    .references(() => questions.uid, { onDelete: "cascade" }),
  timeCreated: timestamp("time_created", { mode: "date" }).defaultNow(),
  author: text("author")
    .notNull()
    .references(() => users.username, { onUpdate: "cascade" }),
  upvotesCount: integer("upvotes_count").default(0),
  redditUpvotes: integer("reddit_upvotes").default(0),
});

export const questionUpvotes = pgTable("question_upvotes", {
  username: text("username")
    .notNull()
    .references(() => users.username, { onUpdate: "cascade", onDelete: "cascade" }),
  questionUid: uuid("question_uid")
    .notNull()
    .references(() => questions.uid, { onDelete: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.username, table.questionUid], name: "votes_pkey" }),
]);

export const answerUpvotes = pgTable("answer_upvotes", {
  answerUid: uuid("answer_uid")
    .notNull()
    .references(() => answers.uid, { onDelete: "cascade" }),
  username: text("username")
    .notNull()
    .references(() => users.username, { onUpdate: "cascade" }),
}, (table) => [
  primaryKey({ columns: [table.answerUid, table.username], name: "answer_upvotes_pkey" }),
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
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
}, (table) => [
  unique("notifications_dedupe_unique").on(
    table.userUsername,
    table.actorUsername,
    table.type,
    table.referenceUid,
  ),
]);
