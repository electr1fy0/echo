import { afterEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import { handleAppError } from "../lib/http";
import type { AppEnv } from "../types/app";
import { linkPreviewRoutes } from "./link-previews";

function createApp() {
  const app = new Hono<AppEnv>();
  app.onError(handleAppError);
  app.route("/link-previews", linkPreviewRoutes);
  return app;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("link preview route security", () => {
  it("rejects a private target before making a network request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const response = await createApp().request(
      "/link-previews?url=http%3A%2F%2F169.254.169.254%2Flatest%2Fmeta-data",
    );

    expect(response.status).toBe(400);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects redirects from a public URL to a private target", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: { location: "http://127.0.0.1:8787/admin" },
      }),
    );

    const response = await createApp().request(
      "/link-previews?url=https%3A%2F%2Fpublic.example%2Fredirect",
    );

    expect(response.status).toBe(400);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("follows safe redirects and resolves relative preview images against the final URL", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(null, {
          status: 302,
          headers: { location: "/article" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(
          '<html><head><meta property="og:title" content="Hello"><meta property="og:image" content="/cover.png"></head></html>',
          { status: 200, headers: { "content-type": "text/html" } },
        ),
      );

    const response = await createApp().request(
      "/link-previews?url=https%3A%2F%2Fpublic.example%2Fstart",
    );
    const body = await response.json() as { title: string; image: string };

    expect(response.status).toBe(200);
    expect(body.title).toBe("Hello");
    expect(body.image).toBe("https://public.example/cover.png");
  });
});
