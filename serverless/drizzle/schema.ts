import { pgTable, foreignKey, unique, uuid, text, boolean, timestamp, integer, index, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const notifications = pgTable("notifications", {
	uid: uuid().defaultRandom().primaryKey().notNull(),
	userUsername: text("user_username").notNull(),
	actorUsername: text("actor_username"),
	type: text().notNull(),
	referenceUid: uuid("reference_uid").notNull(),
	isRead: boolean("is_read").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.actorUsername],
			foreignColumns: [users.username],
			name: "notifications_actor_username_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.userUsername],
			foreignColumns: [users.username],
			name: "notifications_user_username_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	unique("notifications_dedupe_unique").on(table.userUsername, table.actorUsername, table.type, table.referenceUid),
]);

export const issues = pgTable("issues", {
	id: uuid().defaultRandom(),
	title: text(),
	room: text(),
	category: text(),
	priority: text(),
	assignee: text(),
});

export const users = pgTable("users", {
	username: text().primaryKey().notNull(),
	password: text(),
	email: text().notNull(),
	bio: text().default('Wanderer'),
	avatar: text(),
	answered: integer().default(0),
	posted: integer().default(0),
	verificationToken: text("verification_token"),
	isVerified: boolean("is_verified").default(true),
	links: text(),
	resetToken: text("reset_token"),
	resetExpiry: timestamp("reset_expiry", { mode: 'string' }),
}, (table) => [
	unique("unq_username").on(table.username),
	unique("users_email_key").on(table.email),
]);

export const chambers = pgTable("chambers", {
	uid: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	creatorUsername: text("creator_username"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	colorIndex: integer("color_index").default(0),
	icon: text(),
}, (table) => [
	foreignKey({
			columns: [table.creatorUsername],
			foreignColumns: [users.username],
			name: "chambers_creator_username_fkey"
		}).onUpdate("cascade"),
	unique("chambers_name_key").on(table.name),
]);

export const questions = pgTable("questions", {
	uid: uuid().defaultRandom().primaryKey().notNull(),
	timeCreated: timestamp("time_created", { mode: 'string' }).defaultNow(),
	content: text(),
	author: text().notNull(),
	chamberUid: uuid("chamber_uid").notNull(),
	upvotesCount: integer("upvotes_count").default(0),
	redditUpvotes: integer("reddit_upvotes").default(0),
	acceptedAnswerUid: uuid("accepted_answer_uid"),
	pinnedAt: timestamp("pinned_at", { mode: 'string' }),
}, (table) => [
	index("questions_accepted_answer_uid_idx").using("btree", table.acceptedAnswerUid.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.author],
			foreignColumns: [users.username],
			name: "questions_author_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.chamberUid],
			foreignColumns: [chambers.uid],
			name: "questions_chamber_uid_fkey"
		}).onDelete("cascade"),
]);

export const answers = pgTable("answers", {
	uid: uuid().defaultRandom().primaryKey().notNull(),
	content: text().notNull(),
	questionUid: uuid("question_uid").notNull(),
	timeCreated: timestamp("time_created", { mode: 'string' }).defaultNow(),
	author: text().notNull(),
	upvotesCount: integer("upvotes_count").default(0),
	redditUpvotes: integer("reddit_upvotes").default(0),
}, (table) => [
	foreignKey({
			columns: [table.questionUid],
			foreignColumns: [questions.uid],
			name: "answer_question_uid_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.author],
			foreignColumns: [users.username],
			name: "answers_author_fkey"
		}).onUpdate("cascade"),
]);

export const answerUpvotes = pgTable("answer_upvotes", {
	answerUid: uuid("answer_uid").notNull(),
	username: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.answerUid],
			foreignColumns: [answers.uid],
			name: "answer_upvotes_answer_uid_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.username],
			foreignColumns: [users.username],
			name: "answer_upvotes_username_fkey"
		}).onUpdate("cascade"),
	primaryKey({ columns: [table.answerUid, table.username], name: "answer_upvotes_pkey"}),
]);

export const questionUpvotes = pgTable("question_upvotes", {
	username: text().notNull(),
	questionUid: uuid("question_uid").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.questionUid],
			foreignColumns: [questions.uid],
			name: "votes_question_uid_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.username],
			foreignColumns: [users.username],
			name: "votes_username_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	primaryKey({ columns: [table.username, table.questionUid], name: "votes_pkey"}),
]);

export const chamberMembers = pgTable("chamber_members", {
	chamberUid: uuid("chamber_uid").notNull(),
	username: text().notNull(),
	joinedAt: timestamp("joined_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.chamberUid],
			foreignColumns: [chambers.uid],
			name: "chamber_members_chamber_uid_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.username],
			foreignColumns: [users.username],
			name: "chamber_members_username_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	primaryKey({ columns: [table.chamberUid, table.username], name: "chamber_members_pkey"}),
]);
