export type QuestionId = string;
export type ReplyId = string;

export interface Question {
  uid?: QuestionId;
  content: string;
  timeCreated?: Date;
  author: string;
  upvotes: number;
  isUpvoted: boolean;
}

export interface User {
  username: string;
  email: string;
  bio: string;
  avatar: string;
  answered: number;
  posted: number;
}

export interface QuestionDraft {
  content: string;
}

export interface Reply {
  uid?: ReplyId;
  content: string;
  timeCreated?: Date;
  author: string;
  upvotes?: number;
}

export interface ReplyDraft {
  content: string;
}

export interface UpvoteState {
  isUpvoted: boolean;
}
