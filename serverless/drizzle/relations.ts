import { relations } from "drizzle-orm/relations";
import { users, notifications, chambers, questions, answers, answerUpvotes, questionUpvotes, chamberMembers } from "./schema";

export const notificationsRelations = relations(notifications, ({one}) => ({
	user_actorUsername: one(users, {
		fields: [notifications.actorUsername],
		references: [users.username],
		relationName: "notifications_actorUsername_users_username"
	}),
	user_userUsername: one(users, {
		fields: [notifications.userUsername],
		references: [users.username],
		relationName: "notifications_userUsername_users_username"
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	notifications_actorUsername: many(notifications, {
		relationName: "notifications_actorUsername_users_username"
	}),
	notifications_userUsername: many(notifications, {
		relationName: "notifications_userUsername_users_username"
	}),
	chambers: many(chambers),
	questions: many(questions),
	answers: many(answers),
	answerUpvotes: many(answerUpvotes),
	questionUpvotes: many(questionUpvotes),
	chamberMembers: many(chamberMembers),
}));

export const chambersRelations = relations(chambers, ({one, many}) => ({
	user: one(users, {
		fields: [chambers.creatorUsername],
		references: [users.username]
	}),
	questions: many(questions),
	chamberMembers: many(chamberMembers),
}));

export const questionsRelations = relations(questions, ({one, many}) => ({
	user: one(users, {
		fields: [questions.author],
		references: [users.username]
	}),
	chamber: one(chambers, {
		fields: [questions.chamberUid],
		references: [chambers.uid]
	}),
	answers: many(answers),
	questionUpvotes: many(questionUpvotes),
}));

export const answersRelations = relations(answers, ({one, many}) => ({
	question: one(questions, {
		fields: [answers.questionUid],
		references: [questions.uid]
	}),
	user: one(users, {
		fields: [answers.author],
		references: [users.username]
	}),
	answerUpvotes: many(answerUpvotes),
}));

export const answerUpvotesRelations = relations(answerUpvotes, ({one}) => ({
	answer: one(answers, {
		fields: [answerUpvotes.answerUid],
		references: [answers.uid]
	}),
	user: one(users, {
		fields: [answerUpvotes.username],
		references: [users.username]
	}),
}));

export const questionUpvotesRelations = relations(questionUpvotes, ({one}) => ({
	question: one(questions, {
		fields: [questionUpvotes.questionUid],
		references: [questions.uid]
	}),
	user: one(users, {
		fields: [questionUpvotes.username],
		references: [users.username]
	}),
}));

export const chamberMembersRelations = relations(chamberMembers, ({one}) => ({
	chamber: one(chambers, {
		fields: [chamberMembers.chamberUid],
		references: [chambers.uid]
	}),
	user: one(users, {
		fields: [chamberMembers.username],
		references: [users.username]
	}),
}));