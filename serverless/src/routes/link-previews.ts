import { Hono } from "hono";
import { ApiError } from "../lib/errors";
import { isSafeExternalHttpUrl } from "../lib/url-safety";
import type { AppEnv } from "../types/app";

interface LinkPreviewData {
  title: string | null;
  description: string | null;
  image: string | null;
  url: string;
}

const cache = new Map<string, { data: LinkPreviewData; expiry: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24;
const MAX_CACHE_SIZE = 500;
const MAX_REDIRECTS = 4;

export const linkPreviewRoutes = new Hono<AppEnv>();

async function fetchExternalUrl(url: string): Promise<{ response: Response; finalUrl: string }> {
  let currentUrl = url;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    if (!isSafeExternalHttpUrl(currentUrl)) {
      throw new ApiError(400, "url is not allowed");
    }

    const response = await fetch(currentUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; EchoBot/1.0; +https://turnsout.xyz)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });

    if (![301, 302, 303, 307, 308].includes(response.status)) {
      return { response, finalUrl: currentUrl };
    }

    const location = response.headers.get("location");
    if (!location) return { response, finalUrl: currentUrl };

    currentUrl = new URL(location, currentUrl).href;
  }

  throw new ApiError(400, "too many redirects");
}

linkPreviewRoutes.get("/", async (c) => {
  const url = c.req.query("url");
  if (!url) {
    return c.json({ error: "url query parameter is required" }, 400);
  }

  if (!isSafeExternalHttpUrl(url)) {
    return c.json({ error: "url is not allowed" }, 400);
  }

  const cached = cache.get(url);
  if (cached && cached.expiry > Date.now()) {
    return c.json(cached.data);
  }

  try {
    const { response, finalUrl } = await fetchExternalUrl(url);

    if (!response.ok) {
      return c.json({ title: null, description: null, image: null, url });
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return c.json({ title: null, description: null, image: null, url });
    }

    const html = await response.text();

    const data: LinkPreviewData = {
      title: extractMeta(html, "property", "og:title") || extractTitle(html),
      description:
        extractMeta(html, "property", "og:description") ||
        extractMeta(html, "name", "description"),
      image:
        resolveUrl(extractMeta(html, "property", "og:image"), finalUrl) ||
        resolveUrl(extractMeta(html, "name", "twitter:image"), finalUrl),
      url,
    };

    if (cache.size >= MAX_CACHE_SIZE) {
      const oldest = cache.entries().next().value;
      if (oldest) cache.delete(oldest[0]);
    }
    cache.set(url, { data, expiry: Date.now() + CACHE_TTL });
    return c.json(data);
  } catch (error) {
    if (error instanceof ApiError) throw error;
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
