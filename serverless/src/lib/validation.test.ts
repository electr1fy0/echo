import { describe, it, expect } from "vitest";
import {
  usernameSchema,
  emailSchema,
  passwordSchema,
  signupSchema,
  signinSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  requestPasswordResetSchema,
  resetPasswordSchema,
  createChamberSchema,
  updateChamberSchema,
  createChannelSchema,
  updateChannelSchema,
  createPostSchema,
  updatePostSchema,
  createReplySchema,
  updateReplySchema,
  updateProfileSchema,
  createMessageSchema,
  updateMessageSchema,
  createConversationSchema,
  sendOtpSchema,
  verifyOtpSchema,
  googleOnboardingSchema,
  pollVoteSchema,
  partnerApplySchema,
  updateApplicationSchema,
  changeEmailSchema,
  confirmEmailChangeSchema,
  resolveUsernamesSchema,
  deleteChamberSchema,
  createReportSchema,
  presignUploadSchema,
  trackEventsSchema,
  safeParse,
} from "./validation";
import { ApiError } from "./errors";

const parses = <T>(schema: { safeParse: (v: unknown) => { success: boolean; data?: T } }, value: unknown) =>
  schema.safeParse(value).success;

describe("usernameSchema", () => {
  const valid = [
    "abc",
    "alice",
    "Alice",
    "ALICE",
    "user1",
    "user_name",
    "user-name",
    "a--",
    "A".repeat(20),
    "u99",
    "x-y-z",
    "a_b_c",
    "User123Name",
    "test-user_01",
    "zzz",
    "hello-world_123",
    "q".repeat(3),
    "Ab1-_",
    "mixedCASE123",
    "a-b",
    "a_b",
    "ab1",
    "xyz",
    "longusername12345",
    "n1ck",
    "sarah-connor",
    "a-b-c_d-e_f",
    "user2name3x",
    "MiXeD123_case-name",
  ];

  it.each(valid)("accepts %s", (name) => {
    expect(parses(usernameSchema, name)).toBe(true);
  });

  const invalidStrings: [string, string][] = [
    ["ab", "too short"],
    ["a1", "two chars"],
    ["a9", "two chars"],
    ["a", "single char"],
    ["z", "single char"],
    ["Q", "single char"],
    ["", "empty"],
    [" ".repeat(0) + "abcd ", "trailing space"],
    [" abcd", "leading space"],
    ["1abc", "starts with digit"],
    ["9user", "starts with digit"],
    ["_abc", "starts with underscore"],
    ["-abc", "starts with hyphen"],
    ["a".repeat(21), "too long"],
    ["has space", "contains space"],
    ["café", "non-ascii"],
    ["user@name", "at sign"],
    ["user.name", "dot"],
    ["user!", "exclamation"],
    ["user$money", "dollar"],
    ["emoji😀", "emoji"],
    ["tab\there", "tab"],
    ["new\nline", "newline"],
    ["slash/es", "slash"],
    ["back\\slash", "backslash"],
    ["paren(thesis)", "parens"],
    ["plus+sign", "plus"],
    ["colon:name", "colon"],
    ["question?", "question mark"],
    ["hash#", "hash"],
    ["percent%", "percent"],
    ["amp&ersand", "ampersand"],
    ["star*", "asterisk"],
    ["eq=uals", "equals"],
    ["bra[cket]", "brackets"],
    ["brace{s}", "braces"],
    ["pipe|", "pipe"],
    ["semi;colon", "semicolon"],
    ["quote's", "apostrophe"],
    ["com,ma", "comma"],
    ["less<than", "angle brackets"],
    ["tilde~", "tilde"],
    ["caret^", "caret"],
  ];

  it.each(invalidStrings)("rejects %s (%s)", (input) => {
    expect(usernameSchema.safeParse(input).success).toBe(false);
  });

  const invalidNonStrings: [unknown, string][] = [
    [undefined, "undefined"],
    [null, "null"],
    [123, "number"],
    [true, "boolean"],
    [["alice"], "array"],
    [{}, "object"],
  ];

  it.each(invalidNonStrings)("rejects non-string %s", (input) => {
    expect(usernameSchema.safeParse(input).success).toBe(false);
  });

  describe("reserved usernames", () => {
    const reserved = ["anonymous", "admin", "moderator", "system", "opencode"];

    it.each(reserved)("rejects lowercase %s", (name) => {
      expect(usernameSchema.safeParse(name).success).toBe(false);
    });

    it.each(reserved.map((r) => r.toUpperCase()))("rejects uppercase %s", (name) => {
      expect(usernameSchema.safeParse(name).success).toBe(false);
    });

    it.each(reserved.map((r) => r[0].toUpperCase() + r.slice(1)))("rejects capitalized %s", (name) => {
      expect(usernameSchema.safeParse(name).success).toBe(false);
    });
  });

  describe("transform to lowercase", () => {
    const cases: [string, string][] = [
      ["Alice", "alice"],
      ["ALICE", "alice"],
      ["MiXeDcAsE", "mixedcase"],
      ["User_Name", "user_name"],
      ["User-Name-99", "user-name-99"],
      ["ABC_def-GHI", "abc_def-ghi"],
      ["x", "x"].slice(0, 0) as [string, string],
    ];

    it.each(cases.filter(([i]) => i))("%s -> %s", (input, expected) => {
      expect(usernameSchema.parse(input)).toBe(expected);
    });
  });

  it("preserves digits, underscores and hyphens through transform", () => {
    expect(usernameSchema.parse("A_1-B")).toBe("a_1-b");
  });
});

describe("emailSchema", () => {
  const valid = [
    "a@b.com",
    "user@example.com",
    "first.last@example.com",
    "user+tag@example.com",
    "user_name@example.com",
    "USER@EXAMPLE.COM",
    "User@Example.COM",
    "a@b.co",
    "x@y.io",
    "1234567890@numbers.com",
    "user@sub.domain.com",
    "user@domain-with-hyphen.com",
    "user_name+tag-1@example.co.uk",
    "a".repeat(50) + "@long.local.com",
    "test@localhost.com",
    "up'quote@example.com",
  ];

  it.each(valid)("accepts %s", (input) => {
    expect(emailSchema.safeParse(input).success).toBe(true);
  });

  const invalid = [
    "",
    "not-an-email",
    "plainaddress",
    "@missing-local.com",
    "missing-domain@",
    "two@@ats.com",
    "spaces in@address.com",
    "user@ domain.com",
    "user@do main.com",
    "user@@example.com",
    "user@exam_ple.com",
    ".dotstart@example.com",
    "user@.dotstart.com",
    "user@example..com",
    "user @example.com",
    "user@ example.com",
    "user@exam ple.com",
    "user@example.c om",
    "user name@example.com",
    "user@exam$ple.com",
    "q@w.e",
    "a@b.c",
    "user%percent@example.com",
    "user!excl@example.com",
    "user#hash@example.com",
    "user@example",
    "user@-domain.com",
  ];

  it.each(invalid)("rejects %s", (input) => {
    expect(emailSchema.safeParse(input).success).toBe(false);
  });

  const nonStrings: unknown[] = [undefined, null, 123, true, [], {}];

  it.each(nonStrings)("rejects non-string %s", (input) => {
    expect(emailSchema.safeParse(input).success).toBe(false);
  });

  it("lowercases the domain and local part", () => {
    expect(emailSchema.parse("USER.Name+Tag@Example.COM")).toBe("user.name+tag@example.com");
  });

  it("keeps already-lowercase emails unchanged", () => {
    expect(emailSchema.parse("user@example.com")).toBe("user@example.com");
  });

  it("rejects whitespace-padded emails because validation runs before trim", () => {
    expect(emailSchema.safeParse(" user@example.com ").success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it.each(["123456", "password", "p@ssw0rd", "a".repeat(200), "      ", "abcdef"])(
    "accepts %s",
    (pw) => {
      expect(passwordSchema.safeParse(pw).success).toBe(true);
    },
  );

  it.each(["", "12345", "abcde", " a".trim() + "bcd"])("rejects %s", (pw) => {
    expect(passwordSchema.safeParse(pw).success).toBe(false);
  });

  it("accepts exactly 6 characters", () => {
    expect(passwordSchema.safeParse("123456").success).toBe(true);
  });

  it("rejects 5 characters", () => {
    expect(passwordSchema.safeParse("12345").success).toBe(false);
  });

  it.each([undefined, null, 123456, true])("rejects non-string %s", (input) => {
    expect(passwordSchema.safeParse(input).success).toBe(false);
  });
});

describe("signupSchema", () => {
  const validInput = { username: "Alice", email: "A@B.com", password: "secret123" };

  it("accepts a valid signup and normalizes username and email", () => {
    expect(signupSchema.parse(validInput)).toEqual({
      username: "alice",
      email: "a@b.com",
      password: "secret123",
    });
  });

  it("strips unknown keys", () => {
    const parsed = signupSchema.parse({ ...validInput, isAdmin: true });
    expect(parsed).not.toHaveProperty("isAdmin");
  });

  it("rejects missing username", () => {
    const { username, ...rest } = validInput;
    void username;
    expect(signupSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing email", () => {
    const { email, ...rest } = validInput;
    void email;
    expect(signupSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects missing password", () => {
    const { password, ...rest } = validInput;
    void password;
    expect(signupSchema.safeParse(rest).success).toBe(false);
  });

  it("rejects empty object", () => {
    expect(signupSchema.safeParse({}).success).toBe(false);
  });

  it("rejects reserved username even in valid payload", () => {
    expect(signupSchema.safeParse({ ...validInput, username: "admin" }).success).toBe(false);
  });

  it("rejects short password even with valid username/email", () => {
    expect(signupSchema.safeParse({ ...validInput, password: "12345" }).success).toBe(false);
  });

  it("accepts password of exactly 6 characters", () => {
    expect(signupSchema.safeParse({ ...validInput, password: "123456" }).success).toBe(true);
  });

  it("rejects reserved username in any case", () => {
    expect(signupSchema.safeParse({ ...validInput, username: "Admin" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...validInput, username: "SYSTEM" }).success).toBe(false);
  });

  it("normalizes mixed-case username and email together", () => {
    expect(signupSchema.parse({ username: "MiXeD_01-x", email: "UsEr@ExAmPlE.cOm", password: "secret123" })).toEqual({
      username: "mixed_01-x",
      email: "user@example.com",
      password: "secret123",
    });
  });

  it("rejects invalid email even with valid username/password", () => {
    expect(signupSchema.safeParse({ ...validInput, email: "nope" }).success).toBe(false);
  });

  it("rejects non-object input", () => {
    expect(signupSchema.safeParse("string").success).toBe(false);
    expect(signupSchema.safeParse(null).success).toBe(false);
    expect(signupSchema.safeParse([]).success).toBe(false);
  });
});

describe("signinSchema", () => {
  it("accepts valid credentials and lowercases username", () => {
    expect(signinSchema.parse({ username: "Alice", password: "pw" })).toEqual({
      username: "alice",
      password: "pw",
    });
  });

  it("lowercases mixed-case usernames", () => {
    expect(signinSchema.parse({ username: "MiXeD_CaSe-99", password: "pw" }).username).toBe("mixed_case-99");
  });

  it("accepts single-character usernames unlike signup", () => {
    expect(signinSchema.safeParse({ username: "a", password: "pw" }).success).toBe(true);
  });

  it("rejects empty username", () => {
    expect(signinSchema.safeParse({ username: "", password: "pw" }).success).toBe(false);
  });

  it("rejects missing username", () => {
    expect(signinSchema.safeParse({ password: "pw" }).success).toBe(false);
  });

  it("rejects empty password", () => {
    expect(signinSchema.safeParse({ username: "alice", password: "" }).success).toBe(false);
  });

  it("rejects missing password", () => {
    expect(signinSchema.safeParse({ username: "alice" }).success).toBe(false);
  });

  it("does not require a valid email format for username", () => {
    expect(signinSchema.safeParse({ username: "not an email!", password: "pw" }).success).toBe(true);
  });

  it("strips unknown keys", () => {
    const parsed = signinSchema.parse({ username: "a", password: "b", extra: 1 });
    expect(parsed).toEqual({ username: "a", password: "b" });
  });
});

describe("verifyEmailSchema", () => {
  it.each(["token", "a", " ".repeat(0) + "x", "long-token-value"])("accepts token %s", (token) => {
    expect(verifyEmailSchema.safeParse({ token }).success).toBe(true);
  });

  it.each(["", undefined])("rejects token %s", (token) => {
    expect(verifyEmailSchema.safeParse({ token }).success).toBe(false);
  });

  it.each([42, true, null, ["t"], {}])("rejects non-string token %j", (token) => {
    expect(verifyEmailSchema.safeParse({ token }).success).toBe(false);
  });

  it("rejects missing body fields", () => {
    expect(verifyEmailSchema.safeParse({}).success).toBe(false);
  });
});

describe("resendVerificationSchema", () => {
  it("accepts a valid email", () => {
    expect(resendVerificationSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
  });

  it("normalizes the email", () => {
    expect(resendVerificationSchema.parse({ email: "A@B.COM" })).toEqual({ email: "a@b.com" });
  });

  it.each([{ email: "" }, { email: "bad" }, {}, { email: 42 }])("rejects %j", (input) => {
    expect(resendVerificationSchema.safeParse(input).success).toBe(false);
  });

  it("rejects whitespace-padded email", () => {
    expect(resendVerificationSchema.safeParse({ email: " a@b.com " }).success).toBe(false);
  });
});

describe("requestPasswordResetSchema", () => {
  it("accepts a valid email", () => {
    expect(requestPasswordResetSchema.safeParse({ email: "user@site.org" }).success).toBe(true);
  });

  it("normalizes case", () => {
    expect(requestPasswordResetSchema.parse({ email: "USER@Site.ORG" })).toEqual({ email: "user@site.org" });
  });

  it.each([{ email: "" }, { email: "nope" }, {}])("rejects %j", (input) => {
    expect(requestPasswordResetSchema.safeParse(input).success).toBe(false);
  });
});

describe("resetPasswordSchema", () => {
  const valid = { token: "t", new_password: "123456" };

  it("accepts a valid reset payload", () => {
    expect(resetPasswordSchema.safeParse(valid).success).toBe(true);
  });

  const invalidResets: [{ token?: string; new_password?: string }, string][] = [
    [{ new_password: "123456" }, "missing token"],
    [{ token: "", new_password: "123456" }, "empty token"],
    [{ token: "t" }, "missing password"],
    [{ token: "t", new_password: "12345" }, "short password"],
    [{ token: "t", new_password: "" }, "empty password"],
  ];

  it.each(invalidResets)("rejects %j (%s)", (input) => {
    expect(resetPasswordSchema.safeParse(input).success).toBe(false);
  });
});

describe("createChamberSchema", () => {
  it("applies defaults when only name is given", () => {
    expect(createChamberSchema.parse({ name: "chamber" })).toEqual({
      name: "chamber",
      description: "",
      colorIndex: 0,
    });
  });

  const validNames = ["chamber", "my-chamber", "Chamber1", "x", "a".repeat(100), "with_underscore", "hyphen-name", "CamelCase", "123", "name.with.dot"];

  it.each(validNames)("accepts chamber name %s", (name) => {
    expect(createChamberSchema.safeParse({ name }).success).toBe(true);
  });

  const invalidNames: [string, string][] = [
    ["", "empty"],
    ["my chamber", "contains space"],
    ["tab\tname", "contains tab"],
    ["new\nline", "contains newline"],
    ["a".repeat(101), "too long"],
    [" lead", "leading space"],
    ["trail ", "trailing space"],
    ["mid dle", "middle space"],
  ];

  it.each(invalidNames)("rejects chamber name %s (%s)", (name) => {
    expect(createChamberSchema.safeParse({ name }).success).toBe(false);
  });

  describe("colorIndex bounds", () => {
    it.each([0, 1, 10, 19, 20])("accepts colorIndex %i", (colorIndex) => {
      expect(createChamberSchema.safeParse({ name: "c", colorIndex }).success).toBe(true);
    });

    it.each([-1, 21, 100, 0.5, -0.5, 1.5])("rejects colorIndex %j", (colorIndex) => {
      expect(createChamberSchema.safeParse({ name: "c", colorIndex }).success).toBe(false);
    });

    it.each([NaN, Infinity, -Infinity, "3", null])("rejects non-integer colorIndex %j", (colorIndex) => {
      expect(createChamberSchema.safeParse({ name: "c", colorIndex }).success).toBe(false);
    });

    it("defaults colorIndex to 0", () => {
      expect(createChamberSchema.parse({ name: "c" }).colorIndex).toBe(0);
    });
  });

  describe("description", () => {
    it("defaults description to empty string", () => {
      expect(createChamberSchema.parse({ name: "c" }).description).toBe("");
    });

    it("accepts a description up to 2000 chars", () => {
      expect(createChamberSchema.safeParse({ name: "c", description: "d".repeat(2000) }).success).toBe(true);
    });

    it("rejects a description over 2000 chars", () => {
      expect(createChamberSchema.safeParse({ name: "c", description: "d".repeat(2001) }).success).toBe(false);
    });
  });

  describe("picture and icon", () => {
    const pictureCases: [string | null | undefined, string][] = [
      [undefined, "omitted picture"],
      [null, "null picture"],
      ["https://img.example/x.png", "url picture"],
      ["data:image/png;base64,AAA", "data url picture"],
    ];

    it.each(pictureCases)("accepts %s (%s)", (picture) => {
      expect(createChamberSchema.safeParse({ name: "c", picture }).success).toBe(true);
    });

    const iconCases: [string | null | undefined, string][] = [
      [undefined, "omitted icon"],
      [null, "null icon"],
      ["🔥", "emoji icon"],
      ["icon-name", "string icon"],
    ];

    it.each(iconCases)("accepts icon %j (%s)", (icon) => {
      expect(createChamberSchema.safeParse({ name: "c", icon }).success).toBe(true);
    });

    it("rejects numeric picture", () => {
      expect(createChamberSchema.safeParse({ name: "c", picture: 5 }).success).toBe(false);
    });

    it("rejects numeric icon", () => {
      expect(createChamberSchema.safeParse({ name: "c", icon: 5 }).success).toBe(false);
    });
  });

  it("rejects missing name", () => {
    expect(createChamberSchema.safeParse({}).success).toBe(false);
  });
});

describe("updateChamberSchema", () => {
  it("requires name and description", () => {
    expect(updateChamberSchema.safeParse({ name: "c", description: "d" }).success).toBe(true);
  });

  it("rejects missing description (no default on update)", () => {
    expect(updateChamberSchema.safeParse({ name: "c" }).success).toBe(false);
  });

  it("rejects missing name", () => {
    expect(updateChamberSchema.safeParse({ description: "d" }).success).toBe(false);
  });

  it("allows optional colorIndex within bounds", () => {
    expect(updateChamberSchema.safeParse({ name: "c", description: "d", colorIndex: 7 }).success).toBe(true);
    expect(updateChamberSchema.safeParse({ name: "c", description: "d", colorIndex: 21 }).success).toBe(false);
  });

  it("allows nullable picture and icon", () => {
    expect(updateChamberSchema.safeParse({ name: "c", description: "d", picture: null, icon: null }).success).toBe(true);
  });

  it("rejects out-of-range colorIndex", () => {
    expect(updateChamberSchema.safeParse({ name: "c", description: "d", colorIndex: -1 }).success).toBe(false);
  });

  it("rejects names with spaces", () => {
    expect(updateChamberSchema.safeParse({ name: "two words", description: "d" }).success).toBe(false);
  });
});

describe("createChannelSchema", () => {
  it("accepts minimal channel", () => {
    expect(createChannelSchema.safeParse({ name: "general" }).success).toBe(true);
  });

  it("accepts a name of exactly 100 chars and rejects 101", () => {
    expect(createChannelSchema.safeParse({ name: "a".repeat(100) }).success).toBe(true);
    expect(createChannelSchema.safeParse({ name: "a".repeat(101) }).success).toBe(false);
  });

  it.each([[""], ["a".repeat(101)]])("rejects invalid name %j", (name) => {
    expect(createChannelSchema.safeParse({ name }).success).toBe(false);
  });

  it("allows names with spaces unlike chambers", () => {
    expect(createChannelSchema.safeParse({ name: "random chat" }).success).toBe(true);
  });

  it.each([
    [undefined],
    ["chat"],
    ["🎉"],
    ["a".repeat(50)],
  ])("accepts icon %j", (icon) => {
    expect(createChannelSchema.safeParse({ name: "n", icon }).success).toBe(true);
  });

  it("rejects icon over 50 chars", () => {
    expect(createChannelSchema.safeParse({ name: "n", icon: "a".repeat(51) }).success).toBe(false);
  });

  it("rejects null and non-string icons", () => {
    expect(createChannelSchema.safeParse({ name: "n", icon: null }).success).toBe(false);
    expect(createChannelSchema.safeParse({ name: "n", icon: 7 }).success).toBe(false);
  });

  it.each([
    [undefined],
    [[]],
    [[{ key: "value" }]],
    [["any"]],
  ])("accepts schema %j", (schema) => {
    expect(createChannelSchema.safeParse({ name: "n", schema }).success).toBe(true);
  });

  it("rejects non-array schema", () => {
    expect(createChannelSchema.safeParse({ name: "n", schema: "nope" }).success).toBe(false);
  });
});

describe("updateChannelSchema", () => {
  it("accepts empty update object", () => {
    expect(updateChannelSchema.safeParse({}).success).toBe(true);
  });

  it("accepts partial updates", () => {
    expect(updateChannelSchema.safeParse({ name: "new-name" }).success).toBe(true);
    expect(updateChannelSchema.safeParse({ icon: "i" }).success).toBe(true);
    expect(updateChannelSchema.safeParse({ schema: [] }).success).toBe(true);
  });

  it("still validates provided values", () => {
    expect(updateChannelSchema.safeParse({ name: "" }).success).toBe(false);
    expect(updateChannelSchema.safeParse({ icon: "a".repeat(51) }).success).toBe(false);
  });
});

describe("createPostSchema", () => {
  it("applies all defaults given only chamberUid", () => {
    expect(createPostSchema.parse({ chamberUid: "c1" })).toMatchObject({
      content: "",
      postType: "qna",
      isAnonymous: false,
      acceptsAnswers: false,
    });
  });

  it("requires chamberUid", () => {
    expect(createPostSchema.safeParse({}).success).toBe(false);
    expect(createPostSchema.safeParse({ chamberUid: "" }).success).toBe(false);
  });

  describe("postType union", () => {
    it.each(["qna", "partner", "trade", "taxi"])("accepts postType %s without poll fields", (postType) => {
      expect(createPostSchema.safeParse({ chamberUid: "c", postType }).success).toBe(true);
    });

    it.each(["story", "QNA", "", "polls", 1, null, true])("rejects postType %j", (postType) => {
      expect(createPostSchema.safeParse({ chamberUid: "c", postType }).success).toBe(false);
    });
  });

  describe("content", () => {
    it("defaults content to empty string", () => {
      expect(createPostSchema.parse({ chamberUid: "c" }).content).toBe("");
    });

    it("accepts content up to 100000 chars", () => {
      expect(createPostSchema.safeParse({ chamberUid: "c", content: "x".repeat(100000) }).success).toBe(true);
    });

    it("rejects content over 100000 chars", () => {
      expect(createPostSchema.safeParse({ chamberUid: "c", content: "x".repeat(100001) }).success).toBe(false);
    });
  });

  describe("ttlHours", () => {
    it.each([0.5, 1, 24, 168, 0.001])("accepts positive ttlHours %j", (ttlHours) => {
      expect(createPostSchema.safeParse({ chamberUid: "c", ttlHours }).success).toBe(true);
    });

    it.each([0, -1, -24])("rejects non-positive ttlHours %j", (ttlHours) => {
      expect(createPostSchema.safeParse({ chamberUid: "c", ttlHours }).success).toBe(false);
    });
  });

  describe("pollOptions", () => {
    it("accepts two or more options", () => {
      expect(createPostSchema.safeParse({ chamberUid: "c", pollOptions: ["a", "b"] }).success).toBe(true);
      expect(createPostSchema.safeParse({ chamberUid: "c", pollOptions: ["a", "b", "c"] }).success).toBe(true);
    });

    it("rejects fewer than two options", () => {
      expect(createPostSchema.safeParse({ chamberUid: "c", pollOptions: ["only"] }).success).toBe(false);
      expect(createPostSchema.safeParse({ chamberUid: "c", pollOptions: [] }).success).toBe(false);
    });

    it("rejects empty-string options", () => {
      expect(createPostSchema.safeParse({ chamberUid: "c", pollOptions: ["a", ""] }).success).toBe(false);
    });
  });

  describe("poll post-type refinements", () => {
    const basePoll = { chamberUid: "c", postType: "poll", pollQuestion: "Best editor?", pollOptions: ["vim", "emacs"] };

    it("accepts a complete poll", () => {
      expect(createPostSchema.safeParse(basePoll).success).toBe(true);
    });

    it("rejects a poll without a question", () => {
      expect(createPostSchema.safeParse({ ...basePoll, pollQuestion: undefined }).success).toBe(false);
    });

    it("rejects a poll with a whitespace-only question", () => {
      expect(createPostSchema.safeParse({ ...basePoll, pollQuestion: "   " }).success).toBe(false);
    });

    it("rejects a poll without options", () => {
      const { pollOptions, ...rest } = basePoll;
      void pollOptions;
      expect(createPostSchema.safeParse(rest).success).toBe(false);
    });

    it("accepts a qna post without any poll fields", () => {
      expect(createPostSchema.safeParse({ chamberUid: "c", postType: "qna" }).success).toBe(true);
    });

    it("does not require poll fields for non-poll types even when absent", () => {
      for (const postType of ["partner", "trade", "taxi"] as const) {
        expect(createPostSchema.safeParse({ chamberUid: "c", postType }).success).toBe(true);
      }
    });

    it("rejects duplicate options that differ only by case or surrounding spaces", () => {
      expect(createPostSchema.safeParse({ ...basePoll, pollOptions: ["Vim", "vim"] }).success).toBe(false);
      expect(createPostSchema.safeParse({ ...basePoll, pollOptions: ["vim", " vim "] }).success).toBe(false);
      expect(createPostSchema.safeParse({ ...basePoll, pollOptions: ["a", "b", "a"] }).success).toBe(false);
    });

    it("accepts distinct options regardless of case or spacing", () => {
      expect(createPostSchema.safeParse({ ...basePoll, pollOptions: ["Vim", "emacs"] }).success).toBe(true);
      expect(createPostSchema.safeParse({ ...basePoll, pollOptions: ["vim", "  emacs  "] }).success).toBe(true);
    });

    it("enforces option count bounds of 2..20", () => {
      const two = ["a", "b"];
      const twenty = Array.from({ length: 20 }, (_, i) => `opt${i}`);
      const twentyOne = Array.from({ length: 21 }, (_, i) => `opt${i}`);
      expect(createPostSchema.safeParse({ ...basePoll, pollOptions: two }).success).toBe(true);
      expect(createPostSchema.safeParse({ ...basePoll, pollOptions: twenty }).success).toBe(true);
      expect(createPostSchema.safeParse({ ...basePoll, pollOptions: twentyOne }).success).toBe(false);
    });

    it("enforces per-option max length of 200", () => {
      expect(createPostSchema.safeParse({ ...basePoll, pollOptions: ["a", "o".repeat(200)] }).success).toBe(true);
      expect(createPostSchema.safeParse({ ...basePoll, pollOptions: ["a", "o".repeat(201)] }).success).toBe(false);
    });

    it("enforces question max length of 500", () => {
      expect(createPostSchema.safeParse({ ...basePoll, pollQuestion: "q".repeat(500) }).success).toBe(true);
      expect(createPostSchema.safeParse({ ...basePoll, pollQuestion: "q".repeat(501) }).success).toBe(false);
    });
  });

  describe("booleans", () => {
    it.each([true, false])("accepts isAnonymous %j", (isAnonymous) => {
      expect(createPostSchema.safeParse({ chamberUid: "c", isAnonymous }).success).toBe(true);
    });

    it.each(["yes", 1, null])("rejects isAnonymous %j", (isAnonymous) => {
      expect(createPostSchema.safeParse({ chamberUid: "c", isAnonymous }).success).toBe(false);
    });

    it.each([true, false])("accepts acceptsAnswers %j", (acceptsAnswers) => {
      expect(createPostSchema.safeParse({ chamberUid: "c", acceptsAnswers }).success).toBe(true);
    });
  });

  describe("customFields", () => {
    it("accepts records of any values", () => {
      expect(createPostSchema.safeParse({ chamberUid: "c", customFields: { a: 1, b: "x", c: [1] } }).success).toBe(true);
      expect(createPostSchema.safeParse({ chamberUid: "c", customFields: {} }).success).toBe(true);
    });

    it("rejects non-record customFields", () => {
      expect(createPostSchema.safeParse({ chamberUid: "c", customFields: "str" }).success).toBe(false);
      expect(createPostSchema.safeParse({ chamberUid: "c", customFields: 5 }).success).toBe(false);
    });
  });

  describe("type-specific optional fields", () => {
    it("accepts trade fields", () => {
      const input = { chamberUid: "c", tradePrice: 10, tradeCondition: "used", tradeBookIsbn: "978-3-16-148410-0" };
      expect(createPostSchema.safeParse(input).success).toBe(true);
    });

    it("rejects non-integer tradePrice", () => {
      expect(createPostSchema.safeParse({ chamberUid: "c", tradePrice: 9.99 }).success).toBe(false);
    });

    it("accepts taxi fields", () => {
      const input = {
        chamberUid: "c",
        taxiDeparture: "Campus A",
        taxiDestination: "Airport",
        taxiDatetime: "2026-08-22T10:00:00Z",
        taxiSeatsAvailable: 3,
      };
      expect(createPostSchema.safeParse(input).success).toBe(true);
    });

    it("rejects non-integer taxiSeatsAvailable", () => {
      expect(createPostSchema.safeParse({ chamberUid: "c", taxiSeatsAvailable: 2.5 }).success).toBe(false);
    });

    it("accepts partner fields", () => {
      const input = { chamberUid: "c", partnerTargetGrade: "A", partnerWorkstyle: "remote", partnerSlotsNeeded: 2 };
      expect(createPostSchema.safeParse(input).success).toBe(true);
    });

    it("rejects non-integer partnerSlotsNeeded", () => {
      expect(createPostSchema.safeParse({ chamberUid: "c", partnerSlotsNeeded: 1.5 }).success).toBe(false);
    });

    it("accepts pollQuestion alongside options", () => {
      const input = { chamberUid: "c", pollQuestion: "Best editor?", pollOptions: ["vim", "emacs"] };
      expect(createPostSchema.safeParse(input).success).toBe(true);
    });

    it("accepts optional channelUid", () => {
      expect(createPostSchema.safeParse({ chamberUid: "c", channelUid: "ch1" }).success).toBe(true);
    });
  });
});

describe("updatePostSchema", () => {
  it("accepts an empty update", () => {
    expect(updatePostSchema.safeParse({}).success).toBe(true);
  });

  const singleFieldCases: [Record<string, unknown>, string][] = [
    [{ content: "updated" }, "content"],
    [{ customFields: { k: "v" } }, "customFields"],
    [{ tradeStatus: "sold" }, "tradeStatus"],
    [{ partnerSlotsNeeded: 3 }, "partnerSlotsNeeded"],
    [{ partnerStatus: "closed" }, "partnerStatus"],
    [{ tradePrice: 25 }, "tradePrice"],
    [{ tradeCondition: "like new" }, "tradeCondition"],
    [{ tradeBookIsbn: "isbn" }, "tradeBookIsbn"],
    [{ partnerTargetGrade: "B" }, "partnerTargetGrade"],
    [{ partnerWorkstyle: "hybrid" }, "partnerWorkstyle"],
    [{ taxiDeparture: "X" }, "taxiDeparture"],
    [{ taxiDestination: "Y" }, "taxiDestination"],
    [{ taxiDatetime: "2026-01-01" }, "taxiDatetime"],
    [{ taxiSeatsAvailable: 1 }, "taxiSeatsAvailable"],
    [{ taxiStatus: "full" }, "taxiStatus"],
  ];

  it.each(singleFieldCases)("accepts %s alone", (_input, field) => {
    expect(updatePostSchema.safeParse(_input).success).toBe(true);
  });

  it("rejects wrong types", () => {
    expect(updatePostSchema.safeParse({ content: 5 }).success).toBe(false);
    expect(updatePostSchema.safeParse({ tradePrice: "cheap" }).success).toBe(false);
    expect(updatePostSchema.safeParse({ taxiSeatsAvailable: 1.5 }).success).toBe(false);
    expect(updatePostSchema.safeParse({ partnerSlotsNeeded: true }).success).toBe(false);
  });

  it("enforces content max length", () => {
    expect(updatePostSchema.safeParse({ content: "x".repeat(100001) }).success).toBe(false);
  });
});

describe("createReplySchema", () => {
  it("defaults isAnonymous to false", () => {
    expect(createReplySchema.parse({ content: "hi" })).toEqual({ content: "hi", isAnonymous: false });
  });

  it.each(["a", "hello world", "x".repeat(100000)])("accepts content %j", (content) => {
    expect(createReplySchema.safeParse({ content }).success).toBe(true);
  });

  it.each(["", "x".repeat(100001), undefined, "   ", "\n\t  "])("rejects content %j", (content) => {
    expect(createReplySchema.safeParse({ content }).success).toBe(false);
  });

  it("accepts content that is only whitespace-padded around text", () => {
    expect(createReplySchema.safeParse({ content: "  padded reply  " }).success).toBe(true);
  });

  it("accepts optional parentReplyUid", () => {
    expect(createReplySchema.safeParse({ content: "c", parentReplyUid: "r1" }).success).toBe(true);
    expect(createReplySchema.safeParse({ content: "c", parentReplyUid: undefined }).success).toBe(true);
  });

  it("accepts anonymous replies", () => {
    expect(createReplySchema.safeParse({ content: "c", isAnonymous: true }).success).toBe(true);
  });
});

describe("updateReplySchema", () => {
  it("requires non-empty content", () => {
    expect(updateReplySchema.safeParse({ content: "new text" }).success).toBe(true);
    expect(updateReplySchema.safeParse({ content: "" }).success).toBe(false);
    expect(updateReplySchema.safeParse({}).success).toBe(false);
  });

  it("rejects whitespace-only content", () => {
    expect(updateReplySchema.safeParse({ content: "   " }).success).toBe(false);
    expect(updateReplySchema.safeParse({ content: "\t\n" }).success).toBe(false);
  });

  it("enforces max length", () => {
    expect(updateReplySchema.safeParse({ content: "x".repeat(100000) }).success).toBe(true);
    expect(updateReplySchema.safeParse({ content: "x".repeat(100001) }).success).toBe(false);
  });
});

describe("updateProfileSchema", () => {
  it("accepts an empty profile update", () => {
    expect(updateProfileSchema.safeParse({}).success).toBe(true);
  });

  it("lowercases username when provided", () => {
    expect(updateProfileSchema.parse({ username: "Alice" })).toEqual({ username: "alice" });
  });

  it("lowercases mixed-case usernames with digits and separators", () => {
    expect(updateProfileSchema.parse({ username: "User_01-X" })).toEqual({ username: "user_01-x" });
  });

  it("does not apply reserved-name rules to profile updates", () => {
    expect(updateProfileSchema.safeParse({ username: "admin" }).success).toBe(true);
  });

  it("normalizes email when provided", () => {
    expect(updateProfileSchema.parse({ email: "A@B.COM" })).toEqual({ email: "a@b.com" });
  });

  it("rejects invalid email", () => {
    expect(updateProfileSchema.safeParse({ email: "bad" }).success).toBe(false);
  });

  it("enforces bio length limit of 500", () => {
    expect(updateProfileSchema.safeParse({ bio: "b".repeat(500) }).success).toBe(true);
    expect(updateProfileSchema.safeParse({ bio: "b".repeat(501) }).success).toBe(false);
  });

  it.each([
    [{ avatar: "https://x/y.png" }],
    [{ link: "https://mysite.dev" }],
    [{ dmEnabled: true }],
    [{ dmEnabled: false }],
    [{ tourSeen: true }],
    [{ tourSeen: false }],
  ])("accepts %j", (input) => {
    expect(updateProfileSchema.safeParse(input).success).toBe(true);
  });

  it("rejects wrong types", () => {
    expect(updateProfileSchema.safeParse({ dmEnabled: "yes" }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ tourSeen: 1 }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ bio: 500 }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ avatar: 42 }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ link: true }).success).toBe(false);
    expect(updateProfileSchema.safeParse({ username: 7 }).success).toBe(false);
  });

  it("accepts combined updates and normalizes all provided fields", () => {
    expect(
      updateProfileSchema.parse({ username: "Alice", email: "A@B.COM", bio: "hi", dmEnabled: true }),
    ).toEqual({ username: "alice", email: "a@b.com", bio: "hi", dmEnabled: true });
  });
});

describe("message schemas", () => {
  it.each([
    ["createMessageSchema", createMessageSchema],
    ["updateMessageSchema", updateMessageSchema],
  ] as const)("%s requires content between 1 and 10000", (_name, schema) => {
    expect(schema.safeParse({ content: "hello" }).success).toBe(true);
    expect(schema.safeParse({ content: "" }).success).toBe(false);
    expect(schema.safeParse({ content: "m".repeat(10000) }).success).toBe(true);
    expect(schema.safeParse({ content: "m".repeat(10001) }).success).toBe(false);
    expect(schema.safeParse({}).success).toBe(false);
  });

  it.each([createMessageSchema, updateMessageSchema])("rejects whitespace-only content %j", (schema) => {
    expect(schema.safeParse({ content: "   " }).success).toBe(false);
    expect(schema.safeParse({ content: "\n" }).success).toBe(false);
  });

  it("rejects non-string content", () => {
    expect(createMessageSchema.safeParse({ content: 42 }).success).toBe(false);
    expect(updateMessageSchema.safeParse({ content: null }).success).toBe(false);
  });
});

describe("createConversationSchema", () => {
  it("requires a username", () => {
    expect(createConversationSchema.safeParse({ username: "alice" }).success).toBe(true);
    expect(createConversationSchema.safeParse({ username: "" }).success).toBe(false);
    expect(createConversationSchema.safeParse({}).success).toBe(false);
  });
});

describe("sendOtpSchema", () => {
  it("accepts valid email", () => {
    expect(sendOtpSchema.safeParse({ email: "a@b.com" }).success).toBe(true);
  });

  it("normalizes email", () => {
    expect(sendOtpSchema.parse({ email: "U@V.CO" })).toEqual({ email: "u@v.co" });
  });

  it.each([{ email: "" }, { email: "x" }, {}])("rejects %j", (input) => {
    expect(sendOtpSchema.safeParse(input).success).toBe(false);
  });
});

describe("verifyOtpSchema", () => {
  it("accepts email with 6-digit otp", () => {
    expect(verifyOtpSchema.safeParse({ email: "a@b.com", otp: "123456" }).success).toBe(true);
  });

  it.each(["12345", "1234567", "", "abcdefg", "12 456"])("rejects otp %j", (otp) => {
    expect(verifyOtpSchema.safeParse({ email: "a@b.com", otp }).success).toBe(false);
  });

  it.each(["abcdef", "1a2b3c", "12.456", "12345 ", "-12345"])("rejects non-numeric 6-char otp %j", (otp) => {
    expect(verifyOtpSchema.safeParse({ email: "a@b.com", otp }).success).toBe(false);
  });

  it("accepts all-digit otps including leading zeros", () => {
    expect(verifyOtpSchema.safeParse({ email: "a@b.com", otp: "000000" }).success).toBe(true);
    expect(verifyOtpSchema.safeParse({ email: "a@b.com", otp: "999999" }).success).toBe(true);
  });

  it("rejects missing email", () => {
    expect(verifyOtpSchema.safeParse({ otp: "123456" }).success).toBe(false);
  });
});

describe("googleOnboardingSchema", () => {
  it("accepts token plus valid username", () => {
    expect(googleOnboardingSchema.safeParse({ token: "t", username: "alice" }).success).toBe(true);
  });

  it("normalizes username", () => {
    expect(googleOnboardingSchema.parse({ token: "t", username: "Alice" })).toEqual({ token: "t", username: "alice" });
  });

  it("applies full username rules", () => {
    expect(googleOnboardingSchema.safeParse({ token: "t", username: "ab" }).success).toBe(false);
    expect(googleOnboardingSchema.safeParse({ token: "t", username: "admin" }).success).toBe(false);
    expect(googleOnboardingSchema.safeParse({ token: "t", username: "1abc" }).success).toBe(false);
  });

  it("applies reserved-name rules case-insensitively", () => {
    expect(googleOnboardingSchema.safeParse({ token: "t", username: "Admin" }).success).toBe(false);
    expect(googleOnboardingSchema.safeParse({ token: "t", username: "OPENCODE" }).success).toBe(false);
    expect(googleOnboardingSchema.safeParse({ token: "t", username: "System" }).success).toBe(false);
  });

  it("rejects non-string username and token", () => {
    expect(googleOnboardingSchema.safeParse({ token: 42, username: "alice" }).success).toBe(false);
    expect(googleOnboardingSchema.safeParse({ token: "t", username: ["a"] }).success).toBe(false);
  });

  it("requires token", () => {
    expect(googleOnboardingSchema.safeParse({ token: "", username: "alice" }).success).toBe(false);
    expect(googleOnboardingSchema.safeParse({ username: "alice" }).success).toBe(false);
  });
});

describe("pollVoteSchema", () => {
  it.each([0, 1, 5, 100, 999999])("accepts optionIndex %i", (optionIndex) => {
    expect(pollVoteSchema.safeParse({ optionIndex }).success).toBe(true);
  });

  it.each([-1, -100, 0.5, "0", null, undefined])("rejects optionIndex %j", (optionIndex) => {
    expect(pollVoteSchema.safeParse({ optionIndex }).success).toBe(false);
  });

  it.each([NaN, Infinity, -Infinity])("rejects non-finite optionIndex %j", (optionIndex) => {
    expect(pollVoteSchema.safeParse({ optionIndex }).success).toBe(false);
  });

  it("rejects missing optionIndex", () => {
    expect(pollVoteSchema.safeParse({}).success).toBe(false);
  });
});

describe("partnerApplySchema", () => {
  it.each(["pitch", "a", "p".repeat(5000), "  padded pitch "])("accepts pitch %j", (pitch) => {
    expect(partnerApplySchema.safeParse({ pitch }).success).toBe(true);
  });

  it.each(["", "p".repeat(5001), undefined, "   ", "\t\n"])("rejects pitch %j", (pitch) => {
    expect(partnerApplySchema.safeParse({ pitch }).success).toBe(false);
  });

  it("rejects non-string pitch", () => {
    expect(partnerApplySchema.safeParse({ pitch: 123 }).success).toBe(false);
  });
});

describe("updateApplicationSchema", () => {
  it.each(["accepted", "declined"])("accepts status %s", (status) => {
    expect(updateApplicationSchema.safeParse({ status }).success).toBe(true);
  });

  it.each(["pending", "ACCEPTED", "", "rejected", 1, null, undefined])("rejects status %j", (status) => {
    expect(updateApplicationSchema.safeParse({ status }).success).toBe(false);
  });
});

describe("changeEmailSchema", () => {
  it("accepts and normalizes new_email", () => {
    expect(changeEmailSchema.parse({ new_email: "New@Mail.COM" })).toEqual({ new_email: "new@mail.com" });
  });

  it.each([{ new_email: "" }, { new_email: "bad" }, {}, { new_email: 42 }, { new_email: null }])("rejects %j", (input) => {
    expect(changeEmailSchema.safeParse(input).success).toBe(false);
  });
});

describe("confirmEmailChangeSchema", () => {
  it("accepts a 6-char otp", () => {
    expect(confirmEmailChangeSchema.safeParse({ otp: "654321" }).success).toBe(true);
  });

  it.each(["12345", "1234567", "", undefined])("rejects otp %j", (otp) => {
    expect(confirmEmailChangeSchema.safeParse({ otp }).success).toBe(false);
  });

  it("rejects non-numeric otps", () => {
    expect(confirmEmailChangeSchema.safeParse({ otp: "abcdef" }).success).toBe(false);
    expect(confirmEmailChangeSchema.safeParse({ otp: "12 456" }).success).toBe(false);
  });
});

describe("resolveUsernamesSchema", () => {
  it("accepts an array of usernames", () => {
    expect(resolveUsernamesSchema.safeParse({ usernames: ["a", "b"] }).success).toBe(true);
    expect(resolveUsernamesSchema.safeParse({ usernames: [] }).success).toBe(true);
  });

  it("accepts up to 100 usernames", () => {
    expect(resolveUsernamesSchema.safeParse({ usernames: Array.from({ length: 100 }, (_, i) => `u${i}`) }).success).toBe(true);
  });

  it("rejects more than 100 usernames", () => {
    expect(resolveUsernamesSchema.safeParse({ usernames: Array.from({ length: 101 }, (_, i) => `u${i}`) }).success).toBe(false);
  });

  it("rejects missing or non-array usernames", () => {
    expect(resolveUsernamesSchema.safeParse({}).success).toBe(false);
    expect(resolveUsernamesSchema.safeParse({ usernames: "alice" }).success).toBe(false);
    expect(resolveUsernamesSchema.safeParse({ usernames: null }).success).toBe(false);
  });

  it("rejects arrays containing non-string elements", () => {
    expect(resolveUsernamesSchema.safeParse({ usernames: ["a", 42] }).success).toBe(false);
    expect(resolveUsernamesSchema.safeParse({ usernames: [null] }).success).toBe(false);
  });

  it("accepts usernames that would not pass signup rules (no validation here)", () => {
    expect(resolveUsernamesSchema.safeParse({ usernames: ["x", "ADMIN", "with space"] }).success).toBe(true);
  });
});

describe("deleteChamberSchema", () => {
  it("requires a name", () => {
    expect(deleteChamberSchema.safeParse({ name: "my-chamber" }).success).toBe(true);
    expect(deleteChamberSchema.safeParse({ name: "" }).success).toBe(false);
    expect(deleteChamberSchema.safeParse({}).success).toBe(false);
  });
});

describe("createReportSchema", () => {
  it.each(["post", "reply"])("accepts targetType %s", (targetType) => {
    expect(createReportSchema.safeParse({ targetType, targetUid: "uid-1" }).success).toBe(true);
  });

  it.each(["comment", "user", "POST", "", null, undefined])("rejects targetType %j", (targetType) => {
    expect(createReportSchema.safeParse({ targetType, targetUid: "uid-1" }).success).toBe(false);
  });

  it.each(["", undefined])("rejects targetUid %j", (targetUid) => {
    expect(createReportSchema.safeParse({ targetType: "post", targetUid }).success).toBe(false);
  });
});

describe("presignUploadSchema", () => {
  it("accepts filename and contentType", () => {
    expect(presignUploadSchema.safeParse({ filename: "photo.jpg", contentType: "image/jpeg" }).success).toBe(true);
  });

  it("accepts path-like filenames and arbitrary content types", () => {
    expect(presignUploadSchema.safeParse({ filename: "a/b/c (1).png", contentType: "application/octet-stream" }).success).toBe(true);
  });

  it.each([
    [{ filename: "", contentType: "image/jpeg" }],
    [{ filename: "photo.jpg", contentType: "" }],
    [{ filename: "photo.jpg" }],
    [{ contentType: "image/jpeg" }],
    [{ filename: 42, contentType: "image/jpeg" }],
    [{ filename: "photo.jpg", contentType: null }],
    [{}],
  ])("rejects %j", (input) => {
    expect(presignUploadSchema.safeParse(input).success).toBe(false);
  });
});

describe("trackEventsSchema", () => {
  it("accepts a valid event batch", () => {
    const input = {
      events: [
        { event: "page_view", properties: { url: "/home" }, page: "/home" },
        { event: "click" },
        { event: "scroll", properties: {} },
      ],
    };
    expect(trackEventsSchema.safeParse(input).success).toBe(true);
  });

  it("accepts an empty batch", () => {
    expect(trackEventsSchema.safeParse({ events: [] }).success).toBe(true);
  });

  it("accepts up to 100 events", () => {
    const events = Array.from({ length: 100 }, () => ({ event: "e" }));
    expect(trackEventsSchema.safeParse({ events }).success).toBe(true);
  });

  it("rejects more than 100 events", () => {
    const events = Array.from({ length: 101 }, () => ({ event: "e" }));
    expect(trackEventsSchema.safeParse({ events }).success).toBe(false);
  });

  it("rejects events without a name", () => {
    expect(trackEventsSchema.safeParse({ events: [{ properties: {} }] }).success).toBe(false);
    expect(trackEventsSchema.safeParse({ events: [{ event: "" }] }).success).toBe(false);
    expect(trackEventsSchema.safeParse({ events: [{ event: 42 }] }).success).toBe(false);
  });

  it("rejects null or non-object properties and non-string page", () => {
    expect(trackEventsSchema.safeParse({ events: [{ event: "e", properties: null }] }).success).toBe(false);
    expect(trackEventsSchema.safeParse({ events: [{ event: "e", properties: "no" }] }).success).toBe(false);
    expect(trackEventsSchema.safeParse({ events: [{ event: "e", page: 3 }] }).success).toBe(false);
  });

  it("rejects non-array events", () => {
    expect(trackEventsSchema.safeParse({ events: "all" }).success).toBe(false);
    expect(trackEventsSchema.safeParse({}).success).toBe(false);
  });

  it("rejects non-object properties", () => {
    expect(trackEventsSchema.safeParse({ events: [{ event: "e", properties: "no" }] }).success).toBe(false);
  });

  it("allows arbitrary property values", () => {
    const input = { events: [{ event: "e", properties: { n: 1, s: "x", b: true, arr: [1], obj: { deep: true } } }] };
    expect(trackEventsSchema.safeParse(input).success).toBe(true);
  });
});

describe("safeParse helper", () => {
  it("returns parsed data on success", () => {
    expect(safeParse(passwordSchema, "123456")).toBe("123456");
  });

  it("returns transformed data on success", () => {
    expect(safeParse(usernameSchema, "Alice")).toBe("alice");
  });

  it("throws ApiError with status 400 on failure", () => {
    try {
      safeParse(passwordSchema, "12345");
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(400);
    }
  });

  it("includes field path and message in error text", () => {
    try {
      safeParse(signupSchema, { username: "ab", email: "bad", password: "ok!!!" });
      expect.unreachable();
    } catch (err) {
      const message = (err as ApiError).message;
      expect(message).toContain("username:");
      expect(message).toContain("email:");
      expect(message).toContain("invalid email format");
    }
  });

  it("joins multiple issues with semicolons", () => {
    try {
      safeParse(signupSchema, { username: "ab", email: "bad", password: "123" });
      expect.unreachable();
    } catch (err) {
      const message = (err as ApiError).message;
      expect(message).toContain("; ");
    }
  });

  it("reports nested path for object schemas", () => {
    try {
      safeParse(verifyOtpSchema, { email: "a@b.com", otp: "1" });
      expect.unreachable();
    } catch (err) {
      expect((err as ApiError).message).toContain("otp: otp must be 6 digits");
    }
  });

  it("works with primitive schemas", () => {
    expect(safeParse(passwordSchema, "longenough")).toBe("longenough");
  });

  it("propagates custom messages into the ApiError", () => {
    try {
      safeParse(pollVoteSchema, { optionIndex: -1 });
      expect.unreachable();
    } catch (err) {
      expect((err as ApiError).message).toContain("optionIndex is required");
    }
  });
});
