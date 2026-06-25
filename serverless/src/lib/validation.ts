import { z } from "zod";
import { ApiError } from "./errors";

const RESERVED_USERNAMES = ["anonymous", "admin", "moderator", "system", "opencode"];

export const usernameSchema = z.string()
  .min(3, "username must be at least 3 characters")
  .max(20, "username must be at most 20 characters")
  .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/, "username must start with a letter and contain only letters, numbers, underscores, and hyphens")
  .refine((v) => !RESERVED_USERNAMES.includes(v.toLowerCase()), "this username is reserved");

export const emailSchema = z.string()
  .email("invalid email format")
  .transform((v) => v.trim().toLowerCase());

export const passwordSchema = z.string()
  .min(6, "password must be at least 6 characters");

export const signupSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const signinSchema = z.object({
  username: z.string().min(1, "username is required"),
  password: z.string().min(1, "password is required"),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "token is required"),
});

export const resendVerificationSchema = z.object({
  email: emailSchema,
});

export const requestPasswordResetSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "token is required"),
  new_password: passwordSchema,
});

export const createChamberSchema = z.object({
  name: z.string().min(1, "name is required").max(100),
  description: z.string().max(2000).default(""),
  colorIndex: z.number().int().min(0).max(20).default(0),
  picture: z.string().nullable().optional(),
});

export const updateChamberSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(2000),
  colorIndex: z.number().int().min(0).max(20).optional(),
  picture: z.string().nullable().optional(),
});

export const createChannelSchema = z.object({
  name: z.string().min(1, "channel name is required").max(100),
  icon: z.string().max(50).optional(),
  schema: z.array(z.any()).optional(),
});

export const updateChannelSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  icon: z.string().max(50).optional(),
  schema: z.array(z.any()).optional(),
});

export const createPostSchema = z.object({
  content: z.string().max(100000).optional().default(""),
  chamberUid: z.string().min(1, "chamber uid is required"),
  channelUid: z.string().optional(),
  customFields: z.record(z.string(), z.any()).optional(),
  postType: z.union([z.literal("qna"), z.literal("partner"), z.literal("trade"), z.literal("taxi"), z.literal("poll")]).optional().default("qna"),
  isAnonymous: z.boolean().optional().default(false),
  ttlHours: z.number().positive().optional(),
  partnerTargetGrade: z.string().optional(),
  partnerWorkstyle: z.string().optional(),
  partnerSlotsNeeded: z.number().int().optional(),
  tradePrice: z.number().int().optional(),
  tradeCondition: z.string().optional(),
  tradeBookIsbn: z.string().optional(),
  taxiDeparture: z.string().optional(),
  taxiDestination: z.string().optional(),
  taxiDatetime: z.string().optional(),
  taxiSeatsAvailable: z.number().int().optional(),
  pollQuestion: z.string().optional(),
  pollOptions: z.array(z.string().min(1)).min(2, "poll must have at least 2 options").optional(),
});

export const updatePostSchema = z.object({
  content: z.string().max(100000).optional(),
  customFields: z.record(z.string(), z.any()).optional(),
  tradeStatus: z.string().optional(),
  partnerSlotsNeeded: z.number().int().optional(),
  partnerStatus: z.string().optional(),
  tradePrice: z.number().int().optional(),
  tradeCondition: z.string().optional(),
  tradeBookIsbn: z.string().optional(),
  partnerTargetGrade: z.string().optional(),
  partnerWorkstyle: z.string().optional(),
  taxiDeparture: z.string().optional(),
  taxiDestination: z.string().optional(),
  taxiDatetime: z.string().optional(),
  taxiSeatsAvailable: z.number().int().optional(),
  taxiStatus: z.string().optional(),
});

export const createReplySchema = z.object({
  content: z.string().min(1, "content is required").max(100000),
  parentReplyUid: z.string().optional(),
  isAnonymous: z.boolean().optional().default(false),
});

export const updateReplySchema = z.object({
  content: z.string().min(1, "content is required").max(100000),
});

export const updateProfileSchema = z.object({
  username: z.string().optional(),
  bio: z.string().max(500).optional(),
  avatar: z.string().optional(),
  link: z.string().optional(),
  dmEnabled: z.boolean().optional(),
});

export const createMessageSchema = z.object({
  content: z.string().min(1, "content is required").max(10000),
});

export const createConversationSchema = z.object({
  username: z.string().min(1, "username is required"),
});

export const updateMessageSchema = z.object({
  content: z.string().min(1, "content is required").max(10000),
});

export const sendOtpSchema = z.object({
  email: emailSchema,
});

export const verifyOtpSchema = z.object({
  email: emailSchema,
  otp: z.string().length(6, "otp must be 6 digits"),
});

export const googleOnboardingSchema = z.object({
  token: z.string().min(1, "token is required"),
  username: usernameSchema,
});

export const pollVoteSchema = z.object({
  optionIndex: z.number().int().min(0, "optionIndex is required"),
});

export const partnerApplySchema = z.object({
  pitch: z.string().min(1, "pitch is required").max(5000),
});

export const updateApplicationSchema = z.object({
  status: z.union([z.literal("accepted"), z.literal("declined")]),
});

export const changeEmailSchema = z.object({
  new_email: emailSchema,
});

export const confirmEmailChangeSchema = z.object({
  otp: z.string().length(6, "otp must be 6 digits"),
});

export const resolveUsernamesSchema = z.object({
  usernames: z.array(z.string()).max(100, "too many usernames"),
});

export const deleteChamberSchema = z.object({
  name: z.string().min(1, "name is required"),
});

export const presignUploadSchema = z.object({
  filename: z.string().min(1, "filename is required"),
  contentType: z.string().min(1, "contentType is required"),
});

export const trackEventsSchema = z.object({
  events: z.array(z.object({
    event: z.string().min(1),
    properties: z.record(z.string(), z.unknown()).optional(),
    page: z.string().optional(),
  })).max(100, "too many events"),
});

export const safeParse = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new ApiError(400, message);
  }
  return result.data;
};
