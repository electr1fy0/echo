import { describe, expect, it } from "vitest";
import { Hono } from "hono";
import type { AppEnv } from "../types/app";
import { redactAnonymousPostAuthors, redactAnonymousPostResponses } from "./privacy";

describe("redactAnonymousPostAuthors", () => {
  it("removes real author identity from anonymous post payloads", () => {
    const result = redactAnonymousPostAuthors({
      question: {
        uid: "post-1",
        isAnonymous: true,
        authorUsername: "alice",
        content: "secret",
      },
      author: {
        username: "alice",
        avatar: "https://example.com/alice.png",
        reputation: 100,
      },
    }) as any;

    expect(result.question.authorUsername).toBe("Anonymous");
    expect(result.author).toEqual({ username: "Anonymous", avatar: "" });
  });

  it("redacts anonymous posts nested in search-style objects and arrays", () => {
    const result = redactAnonymousPostAuthors({
      questions: [
        {
          question: { uid: "post-1", isAnonymous: true, authorUsername: "alice" },
          author: { username: "alice", avatar: "avatar" },
        },
      ],
    }) as any;

    expect(result.questions[0].question.authorUsername).toBe("Anonymous");
    expect(result.questions[0].author.username).toBe("Anonymous");
  });

  it("leaves non-anonymous authors intact", () => {
    const result = redactAnonymousPostAuthors({
      question: { uid: "post-1", isAnonymous: false, authorUsername: "alice" },
      author: { username: "alice", avatar: "avatar" },
    }) as any;

    expect(result.question.authorUsername).toBe("alice");
    expect(result.author.username).toBe("alice");
  });

  it("preserves the deleted-user marker instead of relabeling it as anonymous", () => {
    const result = redactAnonymousPostAuthors({
      question: { uid: "post-1", isAnonymous: true, authorUsername: "[deleted]" },
      author: { username: "[deleted]", avatar: "" },
    }) as any;

    expect(result.question.authorUsername).toBe("[deleted]");
    expect(result.author.username).toBe("[deleted]");
  });

  it("redacts an actual Hono JSON response", async () => {
    const app = new Hono<AppEnv>();
    app.use("*", redactAnonymousPostResponses);
    app.get("/", (c) => c.json({
      question: { uid: "post-1", isAnonymous: true, authorUsername: "alice" },
      author: { username: "alice", avatar: "avatar" },
    }));

    const response = await app.request("/");
    const body = await response.json() as any;

    expect(body.question.authorUsername).toBe("Anonymous");
    expect(body.author).toEqual({ username: "Anonymous", avatar: "" });
  });
});
