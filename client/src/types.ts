export type QuestionId = string;
export type ReplyId = string;

export interface Question {
  uid?: QuestionId;
  content: string;
  timeCreated?: Date;
  upvotes?: number;
}

export interface QuestionDraft {
  content: string;
}

export interface Reply {
  uid?: ReplyId;
  content: string;
  timeCreated?: Date;
  upvotes?: number;
}

export interface ReplyDraft {
  content: string;
}

export interface UpvoteState {
  count: number;
  isUpvoted: boolean;
}
