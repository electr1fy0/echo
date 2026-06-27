const CRAWLERS = [
  "twitterbot", "facebookexternalhit", "discordbot", "slackbot",
  "telegrambot", "whatsapp", "linkedinbot", "slack-image-crawler",
  "googlebot", "bingbot", "yandexbot", "slurp", "baiduspider",
  "duckduckbot", "embedly", "pinterest", "outline", "vkshare",
  "skypeuripreview", "microdata", "flipboard", "quora link preview",
];

function isCrawler(ua: string): boolean {
  const lower = ua.toLowerCase();
  return CRAWLERS.some((c) => lower.includes(c));
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/!\[.*?\]\([^)]+\)/g, "")
    .replace(/https?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?\S*)?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

interface PostData {
  question: { content: string; slug?: string; isAnonymous?: boolean; authorUsername: string };
  author: { username: string };
}

class HeadRewriter {
  constructor(
    private title: string,
    private description: string,
    private url: string,
    private image: string,
  ) {}

  titleHandler(element: Element) {
    element.setInnerContent(`${this.title} - TurnsOut`);
  }

  headHandler(element: Element) {
    element.append(
      `
<meta name="description" content="${escapeAttr(this.description)}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="${escapeAttr(this.url)}" />
<meta property="og:title" content="${escapeAttr(this.title)}" />
<meta property="og:description" content="${escapeAttr(this.description)}" />
<meta property="og:site_name" content="TurnsOut" />
<meta property="og:image" content="${escapeAttr(this.image)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escapeAttr(this.title)}" />
<meta name="twitter:description" content="${escapeAttr(this.description)}" />
<meta name="twitter:image" content="${escapeAttr(this.image)}" />
`.trim(),
      { html: true },
    );
  }
}

export async function onRequest(context: EventContext<unknown, string, { slug: string }>) {
  const { request, next, env } = context;
  const userAgent = request.headers.get("user-agent") || "";
  if (!isCrawler(userAgent)) {
    return next();
  }

  const url = new URL(request.url);
  const questionId = url.pathname.replace(/^\/p\//, "");
  if (!questionId) return next();

  const apiUrl = (env as Record<string, string | undefined>).VITE_ECHO_URL || "http://localhost:8787";
  const ogImage = `${url.protocol}//${url.host}/api/og?questionId=${encodeURIComponent(questionId)}`;
  const pageUrl = `${url.protocol}//${url.host}/p/${questionId}`;

  let title = "Post on TurnsOut";
  let description = "Join the conversation on TurnsOut";
  let canonicalUrl = pageUrl;
  let canonicalImage = ogImage;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${apiUrl}/questions/${encodeURIComponent(questionId)}`, {
      signal: controller.signal,
      headers: { "User-Agent": "TurnsOut-Crawler/1.0" },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = (await res.json()) as PostData;

      const displayName = data.question.isAnonymous
        ? "Anonymous"
        : data.author?.username || data.question.authorUsername;

      description = stripHtml(data.question.content);
      title = displayName;

      const slug = data.question.slug;
      if (slug) {
        canonicalUrl = `${url.protocol}//${url.host}/p/${slug}`;
        canonicalImage = `${url.protocol}//${url.host}/api/og?questionId=${encodeURIComponent(slug)}`;
      }
    }
  } catch {
    // API fetch failed — fall through to defaults
  }

  const response = await next();
  const rewriter = new HeadRewriter(title, description, canonicalUrl, canonicalImage);

  return new HTMLRewriter()
    .on("title", { element: (el) => rewriter.titleHandler(el) })
    .on("head", { element: (el) => rewriter.headHandler(el) })
    .transform(response);
}
