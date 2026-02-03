export type QuestionId = string;
export type ReplyId = string;
export interface Question {
  uid?: QuestionId;
  content: string;
  timeCreated?: Date;
  authorUsername: string;
  upvotes: number;
  isUpvoted: boolean;
  chamberUid?: string;
  chamberName?: string;
  acceptedAnswerUid?: string;
  isPinned?: boolean;
}
export interface User {
  username: string;
  email: string;
  bio: string;
  avatar: string;
  link?: string;
  answered: number;
  posted: number;
}
export interface UserSummary {
  username: string;
  avatar?: string;
  bio?: string;
}
export interface QuestionItem {
  question: Question;
  author: User;
}
export interface AnswerItem {
  answer: Reply;
  author: User;
}
export interface QuestionDraft {
  content: string;
  chamberUid?: string;
}
export interface Reply {
  uid: ReplyId;
  content: string;
  questionUid: string;
  timeCreated?: Date;
  authorUsername: string;
  upvotes: number;
  isUpvoted: boolean;
  isAccepted?: boolean;
}
export interface ReplyDraft {
  content: string;
}
export interface UpvoteState {
  isUpvoted: boolean;
}
export interface Chamber {
  uid?: string;
  name: string;
  description: string;
  isJoined?: boolean;
  memberCount?: number;
  colorIndex?: number;
  timeCreated?: string;
  creatorUsername?: string;
}
