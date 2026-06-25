import { Hono } from "hono";
import type { AppEnv } from "../types/app";

interface LinkPreviewData {
  title: string | null;
  description: string | null;
  image: string | null;
  url: string;
}

const cache = new Map<string, { data: LinkPreviewData; expiry: number }>();
const CACHE_TTL = 1000 * 60 * 60;

export const linkPreviewRoutes = new Hono<AppEnv>();

linkPreviewRoutes.get("/", async (c) => {
  const url = c.req.query("url");
  if (!url) {
    return c.json({ error: "url query parameter is required" }, 400);
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return c.json({ error: "invalid url protocol" }, 400);
    }
  } catch {
    return c.json({ error: "invalid url" }, 400);
  }

  const cached = cache.get(url);
  if (cached && cached.expiry > Date.now()) {
    return c.json(cached.data);
  }

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; EchoBot/1.0; +https://turnsout.xyz)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return c.json({ title: null, description: null, image: null, url });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return c.json({ title: null, description: null, image: null, url });
    }

    const html = await response.text();

    const data: LinkPreviewData = {
      title: extractMeta(html, "og:title") || extractTitle(html),
      description: extractMeta(html, "og:description") || extractMeta(html, "name", "description"),
      image: resolveUrl(extractMeta(html, "og:image"), url) || resolveUrl(extractMeta(html, "name", "twitter:image"), url),
      url,
    };

    cache.set(url, { data, expiry: Date.now() + CACHE_TTL });
    return c.json(data);
  } catch {
    return c.json({ title: null, description: null, image: null, url });
  }
});

function extractMeta(html: string, attr: string, attrValue?: string): string | null {
  const searchAttr = attrValue ? attrValue : attr;
  const patterns = [
    new RegExp(`<meta[^>]+${attr}=["']${escapeRegex(searchAttr)}["'][^>]+content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+${attr}=["']${escapeRegex(searchAttr)}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const val = decodeEntities(match[1]).trim();
      if (val) return val;
    }
  }
  return null;
}

function extractTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return match ? decodeEntities(match[1]).trim() : null;
}

function resolveUrl(src: string | null, base: string): string | null {
  if (!src) return null;
  try {
    return new URL(src, base).href;
  } catch {
    return null;
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));
}
