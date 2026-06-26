import { ImageResponse } from "@vercel/og";

export const config = {
  runtime: "edge",
};

const PAD = 64;

async function loadFonts(): Promise<
  { name: string; data: ArrayBuffer; weight: number; style: "normal" }[]
> {
  const css = await fetch(
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
  ).then((r) => r.text());

  const urls = [...css.matchAll(/url\(([^)]+)\)/g)].map((m) => m[1]);
  const seen = new Set<string>();

  const results = await Promise.all(
    urls.map(async (url) => {
      const fullUrl = url.startsWith("https")
        ? url
        : url.startsWith("//")
          ? `https:${url}`
          : `https://fonts.gstatic.com/${url.replace(/^\/\//, "")}`;

      if (seen.has(fullUrl)) return null;
      seen.add(fullUrl);

      const data = await fetch(fullUrl).then((r) => r.arrayBuffer());
      const weightMatch = fullUrl.match(/wght@(\d{3})/);
      return {
        name: "Inter",
        data,
        weight: weightMatch ? Number(weightMatch[1]) : 400,
        style: "normal" as const,
      };
    }),
  );

  return results.filter(Boolean) as {
    name: string;
    data: ArrayBuffer;
    weight: number;
    style: "normal";
  }[];
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen).replace(/\s+\S*$/, "") + "…";
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/!\[.*?\]\([^)]+\)/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

interface QuestionData {
  content: string;
  isAnonymous?: boolean;
  authorUsername: string;
  chamberName?: string;
}

interface AuthorData {
  username: string;
  avatar?: string;
}

function PostCard({
  question,
  author,
}: {
  question: QuestionData;
  author?: AuthorData;
}) {
  const isDeleted = author?.username === "[deleted]";
  const displayName = question.isAnonymous
    ? "Anonymous"
    : isDeleted
      ? "[deleted]"
      : author?.username || question.authorUsername;

  const cleanContent = stripHtml(question.content);
  const truncatedContent = truncate(cleanContent, 250);
  const hasMore = cleanContent.length > 250;

  const showAvatar = !question.isAnonymous && !isDeleted;
  const avatarSrc = showAvatar
    ? author?.avatar && !author.avatar.startsWith("https://github.com/")
      ? author.avatar
      : `https://api.dicebear.com/10.x/dylan/svg?seed=${encodeURIComponent(displayName)}`
    : null;

  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        flexDirection: "column",
        background: "#FFFFFF",
        fontFamily: "Inter",
        padding: PAD,
      }}
    >
      {/* Header: Avatar + Username + Chamber */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={displayName}
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
            }}
          />
        ) : (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "#f0f0f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: "#a3a3a3",
                lineHeight: 1,
              }}
            >
              {(displayName || "?").charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <span
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "#171717",
            }}
          >
            {displayName}
          </span>
          {question.chamberName && (
            <span style={{ fontSize: 14, color: "#a3a3a3" }}>
              in {question.chamberName}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: 22,
            fontWeight: 500,
            color: "#171717",
            lineHeight: 1.55,
          }}
        >
          {truncatedContent}
        </span>
        {hasMore && (
          <span
            style={{
              fontSize: 14,
              color: "#a3a3a3",
              marginTop: 10,
            }}
          >
            Continue reading…
          </span>
        )}
      </div>

      {/* Logo at bottom right */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <img
          src="https://turnsout.xyz/turnsout.svg"
          alt=""
          style={{
            width: 28,
            height: 28,
          }}
        />
      </div>
    </div>
  );
}

export default async function handler(
  req: Request,
): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get("questionId");

    if (!questionId) {
      return new Response("Missing questionId", { status: 400 });
    }

    const apiUrl =
      (typeof process !== "undefined" && process.env?.VITE_ECHO_URL) ||
      "http://localhost:8787";

    const res = await fetch(
      `${apiUrl}/questions/${encodeURIComponent(questionId)}`,
      {
        headers: { "User-Agent": "TurnsOut-OG/1.0" },
        signal: AbortSignal.timeout(5000),
      },
    );

    if (!res.ok) {
      return new Response("Post not found", { status: 404 });
    }

    const data = (await res.json()) as {
      question: QuestionData;
      author?: AuthorData;
    };

    const fonts = await loadFonts();

    return new ImageResponse(
      <PostCard question={data.question} author={data.author} />,
      {
        width: 1200,
        height: 630,
        fonts,
        headers: {
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
        },
      },
    );
  } catch (err) {
    console.error("OG image error:", err);
    return new Response("Failed to generate OG image", { status: 500 });
  }
}
