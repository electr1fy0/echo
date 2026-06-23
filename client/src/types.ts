export type QuestionId = string;
export type ReplyId = string;
export interface Question {
  uid?: QuestionId;
  content: string;
  timeCreated?: Date;
  expiresAt?: string | null;
  authorUsername: string;
  upvotes: number;
  isUpvoted: boolean;
  chamberUid?: string;
  chamberName?: string;
  acceptedAnswerUid?: string;
  isPinned?: boolean;
  postType?: "qna" | "partner" | "trade" | "taxi";
  partnerTargetGrade?: string;
  partnerWorkstyle?: string;
  partnerSlotsNeeded?: number;
  partnerStatus?: string;
  tradePrice?: number;
  tradeCondition?: string;
  tradeBookIsbn?: string;
  tradeStatus?: string;
  taxiDeparture?: string;
  taxiDestination?: string;
  taxiDatetime?: string;
  taxiSeatsAvailable?: number;
  taxiStatus?: string;
}
export interface User {
  username: string;
  email: string;
  bio: string;
  avatar: string;
  link?: string;
  answered: number;
  posted: number;
  dmEnabled?: boolean;
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
export interface SearchResponse {
  chambers: Chamber[];
  questions: QuestionItem[];
  replies: AnswerItem[];
  users: UserSummary[];
}
export interface QuestionDraft {
  content: string;
  chamberUid?: string;
  postType?: "qna" | "partner" | "trade" | "taxi";
  ttlHours?: number | null;
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
export interface Conversation {
  uid: string;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  lastMessageSender: string | null;
  participantA: string;
  participantB: string;
  otherUsername: string;
  otherAvatar: string;
  otherBio: string;
  otherDmEnabled: boolean;
}

export interface Message {
  uid: string;
  conversationUid: string;
  sender: string;
  content: string;
  timeCreated: string;
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
