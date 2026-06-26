export const config = {
  matcher: "/q/:path*",
};

const CRAWLERS = [
  "twitterbot",
  "facebookexternalhit",
  "discordbot",
  "slackbot",
  "telegrambot",
  "whatsapp",
  "linkedinbot",
  "slack-image-crawler",
  "googlebot",
  "bingbot",
  "yandexbot",
  "slurp",
  "baiduspider",
  "duckduckbot",
  "embedly",
  "pinterest",
  "outline",
  "vkshare",
  "skypeuripreview",
  "microdata",
  "flipboard",
  "quora link preview",
];

function isCrawler(ua: string): boolean {
  const lower = ua.toLowerCase();
  return CRAWLERS.some((c) => lower.includes(c));
}

function extractImage(html: string): string | null {
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (imgMatch) return imgMatch[1];

  const mdMatch = html.match(/!\[.*?\]\(([^)]+)\)/);
  if (mdMatch) return mdMatch[1];

  return null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/!\[.*?\]\([^)]+\)/g, "")
    .replace(/https?:\/\/\S+\.(?:jpg|jpeg|png|gif|webp|svg)(?:\?\S*)?/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function buildPage(
  title: string,
  description: string,
  url: string,
  image: string,
): string {
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description.slice(0, 300));
  const safeImage = escapeHtml(image);
  const safeUrl = escapeHtml(url);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${safeTitle} - TurnsOut</title>
<meta name="description" content="${safeDesc}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="${safeUrl}" />
<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${safeDesc}" />
<meta property="og:site_name" content="TurnsOut" />
<meta property="og:image" content="${safeImage}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDesc}" />
<meta name="twitter:image" content="${safeImage}" />
</head>
<body>
<script>location.href=${JSON.stringify(url)}</script>
</body>
</html>`;
}

export default async function middleware(
  request: Request,
): Promise<Response | undefined> {
  const userAgent = request.headers.get("user-agent") || "";
  if (!isCrawler(userAgent)) return;

  const url = new URL(request.url);
  const questionId = url.pathname.replace(/^\/q\//, "");
  if (!questionId) return;

  const apiUrl =
    (typeof process !== "undefined" && process.env?.VITE_ECHO_URL) ||
    "http://localhost:8787";

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${apiUrl}/questions/${encodeURIComponent(questionId)}`, {
      signal: controller.signal,
      headers: { "User-Agent": "TurnsOut-Crawler/1.0" },
    });
    clearTimeout(timeout);

    if (!res.ok) return;

    const data = (await res.json()) as {
      question: { content: string; isAnonymous?: boolean; authorUsername: string };
      author: { username: string };
    };

    const content = data.question.content;

    const displayName = data.question.isAnonymous
      ? "Anonymous"
      : data.author?.username || data.question.authorUsername;

    const ogImage = `${url.protocol}//${url.host}/api/og?questionId=${encodeURIComponent(questionId)}`;
    const description = stripHtml(content);

    const pageUrl = `${url.protocol}//${url.host}/q/${questionId}`;

    return new Response(buildPage(displayName, description, pageUrl, ogImage), {
      headers: { "content-type": "text/html;charset=utf-8" },
    });
  } catch {
    return;
  }
}
