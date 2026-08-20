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

  it("parses Open Graph meta tags when content appears before property", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        '<html><head><meta content="Reverse order" property="og:title"><meta content="Summary &amp; more" property="og:description"></head></html>',
        { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
      ),
    );

    const response = await createApp().request(
      "/link-previews?url=https%3A%2F%2Freverse.example%2Fpage",
    );
    const body = await response.json() as { title: string; description: string };

    expect(body.title).toBe("Reverse order");
    expect(body.description).toBe("Summary & more");
  });

  it("falls back to the title element and decodes HTML entities", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("<html><head><title>Fallback &amp; Title</title></head></html>", {
        status: 200,
        headers: { "content-type": "text/html" },
      }),
    );

    const response = await createApp().request(
      "/link-previews?url=https%3A%2F%2Ftitle.example%2Fpage",
    );
    const body = await response.json() as { title: string };

    expect(body.title).toBe("Fallback & Title");
  });

  it("returns an empty preview for non-HTML content", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("binary-ish", {
        status: 200,
        headers: { "content-type": "application/pdf" },
      }),
    );

    const response = await createApp().request(
      "/link-previews?url=https%3A%2F%2Ffiles.example%2Fmanual.pdf",
    );
    const body = await response.json() as { title: null; description: null; image: null };

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ title: null, description: null, image: null });
  });

  it("returns an empty preview for upstream error responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("not found", { status: 404, headers: { "content-type": "text/html" } }),
    );

    const response = await createApp().request(
      "/link-previews?url=https%3A%2F%2Fmissing.example%2Fpage",
    );
    const body = await response.json() as { title: null; description: null; image: null };

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ title: null, description: null, image: null });
  });

  it("rejects redirect chains beyond the configured limit", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    for (let i = 0; i < 5; i++) {
      fetchSpy.mockResolvedValueOnce(
        new Response(null, { status: 302, headers: { location: `/hop-${i + 1}` } }),
      );
    }

    const response = await createApp().request(
      "/link-previews?url=https%3A%2F%2Floopy.example%2Fstart",
    );

    expect(response.status).toBe(400);
    expect(fetchSpy).toHaveBeenCalledTimes(5);
  });
});