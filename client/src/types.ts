export type QuestionId = string;
export type ReplyId = string;
export interface Question {
  uid?: QuestionId;
  slug?: string;
  content: string;
  timeCreated?: Date;
  expiresAt?: string | null;
  authorUsername: string;
  isAnonymous?: boolean;
  upvotes: number;
  isUpvoted: boolean;
  isSaved?: boolean;
  chamberUid?: string;
  chamberName?: string;
  channelUid?: string;
  channelSchema?: SchemaField[];
  customFields?: Record<string, any>;
  acceptedAnswerUid?: string;
  acceptsAnswers?: boolean;
  isPinned?: boolean;
  postType?: "qna" | "partner" | "trade" | "taxi" | "poll";
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
  pollUid?: string;
  pollQuestion?: string;
  pollOptions?: string[];
  pollExpiresAt?: string | null;
  pollIsClosed?: boolean;
  pollVotes?: PollOption[];
  userPollVote?: number | null;
  repliesCount?: number;
}
export interface Badge {
  id: string;
  label: string;
  icon: string;
  earned: boolean;
}

export interface User {
  username: string;
  email: string;
  bio: string;
  avatar: string;
  link?: string;
  reputation: number;
  answered: number;
  posted: number;
  dmEnabled?: boolean;
  tourSeen?: boolean;
  badges?: Badge[];
  isFollowing?: boolean;
  followersCount?: number;
  followingCount?: number;
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
export interface PollOption {
  optionIndex: number;
  count: number;
}

export interface QuestionDraft {
  content: string;
  chamberUid?: string;
  channelUid?: string;
  customFields?: Record<string, any>;
  postType?: "qna" | "partner" | "trade" | "taxi" | "poll";
  ttlHours?: number | null;
  isAnonymous?: boolean;
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
  pollQuestion?: string;
  pollOptions?: string[];
  acceptsAnswers?: boolean;
}
export interface Reply {
  uid: ReplyId;
  content: string;
  questionUid: string;
  parentReplyUid?: string;
  timeCreated?: Date;
  authorUsername: string;
  isAnonymous?: boolean;
  upvotes: number;
  isUpvoted: boolean;
  isAccepted?: boolean;
}
export interface ReplyDraft {
  content: string;
  isAnonymous?: boolean;
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
  unreadCount?: number;
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
  slug?: string;
  name: string;
  description: string;
  isJoined?: boolean;
  memberCount?: number;
  colorIndex?: number;
  timeCreated?: string;
  creatorUsername?: string;
  picture?: string | null;
  icon?: string | null;
}

export interface SchemaField {
  id: string;
  type: "text" | "number" | "currency" | "select" | "datetime" | "url" | "file" | "poll" | "image" | "location" | "source_destination" | "key_value" | "button";
  label: string;
  required: boolean;
  disabled?: boolean;
  options?: string[];
}

export const ALLOWED_FIELD_TYPES = [
  "image",
  "poll",
  "currency",
  "datetime",
  "file",
  "location",
  "source_destination",
  "key_value",
  "button",
] as const;

export type AllowedFieldType = (typeof ALLOWED_FIELD_TYPES)[number];

export interface Channel {
  uid: string;
  chamberUid: string;
  name: string;
  icon?: string;
  schema: SchemaField[];
  createdAt?: string;
}
