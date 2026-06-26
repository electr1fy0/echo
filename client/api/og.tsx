import { ImageResponse } from "@vercel/og";

export const config = {
  runtime: "edge",
};

const POST_TYPE_COLORS: Record<string, string> = {
  qna: "#6366f1",
  trade: "#f59e0b",
  partner: "#10b981",
  taxi: "#3b82f6",
  poll: "#ec4899",
};

const POST_TYPE_LABELS: Record<string, string> = {
  qna: "Q&A",
  trade: "Trade",
  partner: "Partner",
  taxi: "Taxi",
  poll: "Poll",
};

const CARD_W = 1080;
const CARD_H = 540;
const PAD = 48;

async function loadFonts(): Promise<
  { name: string; data: ArrayBuffer; weight: number; style: "normal" }[]
> {
  const css = await fetch(
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap",
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
  postType?: string;
  timeCreated?: string;
  upvotes?: number;
  repliesCount?: number;
  tradePrice?: number;
  tradeCondition?: string;
  tradeStatus?: string;
  partnerTargetGrade?: string;
  partnerWorkstyle?: string;
  partnerStatus?: string;
  taxiDeparture?: string;
  taxiDestination?: string;
  taxiDatetime?: string;
  taxiSeatsAvailable?: number;
  taxiStatus?: string;
  pollQuestion?: string;
}

interface AuthorData {
  username: string;
  avatar?: string;
}

function Avatar({ name, size }: { name: string; size: number }) {
  const initial = (name || "?").charAt(0).toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "#555555",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: size * 0.42,
          fontWeight: 600,
          color: "#f5f5f5",
          lineHeight: 1,
        }}
      >
        {initial}
      </span>
    </div>
  );
}

function PostTypeBadge({ type }: { type?: string }) {
  const label = type ? POST_TYPE_LABELS[type] || type.toUpperCase() : "";
  const bg = type ? POST_TYPE_COLORS[type] || "#6366f1" : "#6366f1";

  if (!label) return null;

  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        color: "#fff",
        background: bg,
        padding: "4px 10px",
        borderRadius: 999,
        letterSpacing: "0.03em",
      }}
    >
      {label}
    </span>
  );
}

function MetadataCard({ question }: { question: QuestionData }) {
  const type = question.postType;

  if (type === "trade") {
    return (
      <div
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 12,
          background: "#2a2a2a",
          display: "flex",
          gap: 24,
          fontSize: 14,
          color: "#d4d4d4",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 10, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.04em" }}>Price</span>
          <span style={{ fontSize: 18, fontWeight: 600, color: "#f5f5f5" }}>
            ₹{question.tradePrice ? (question.tradePrice / 100).toFixed(0) : "—"}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 10, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.04em" }}>Condition</span>
          <span style={{ fontSize: 14, color: "#f5f5f5" }}>{question.tradeCondition || "—"}</span>
        </div>
      </div>
    );
  }

  if (type === "partner") {
    return (
      <div
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 12,
          background: "#2a2a2a",
          display: "flex",
          gap: 24,
          fontSize: 14,
          color: "#d4d4d4",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 10, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.04em" }}>Grade Goal</span>
          <span style={{ fontSize: 14, color: "#f5f5f5" }}>{question.partnerTargetGrade || "Any"}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 10, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.04em" }}>Workstyle</span>
          <span style={{ fontSize: 14, color: "#f5f5f5" }}>{question.partnerWorkstyle || "Any"}</span>
        </div>
      </div>
    );
  }

  if (type === "taxi") {
    return (
      <div
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 12,
          background: "#2a2a2a",
          display: "flex",
          gap: 24,
          fontSize: 14,
          color: "#d4d4d4",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 10, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.04em" }}>From</span>
          <span style={{ fontSize: 14, color: "#f5f5f5" }}>{question.taxiDeparture || "—"}</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 10, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.04em" }}>To</span>
          <span style={{ fontSize: 14, color: "#f5f5f5" }}>{question.taxiDestination || "—"}</span>
        </div>
        {question.taxiSeatsAvailable && (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 10, color: "#a3a3a3", textTransform: "uppercase", letterSpacing: "0.04em" }}>Seats</span>
            <span style={{ fontSize: 14, color: "#f5f5f5" }}>{question.taxiSeatsAvailable}</span>
          </div>
        )}
      </div>
    );
  }

  if (type === "poll" && question.pollQuestion) {
    return (
      <div
        style={{
          marginTop: 12,
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 14,
          color: "#a3a3a3",
        }}
      >
        <span>📊</span>
        <span>{truncate(question.pollQuestion, 80)}</span>
      </div>
    );
  }

  return null;
}

function timeAgo(iso?: string): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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
  const truncatedContent = truncate(cleanContent, 400);
  const hasMore = cleanContent.length > 400;

  const avatarName =
    question.isAnonymous || isDeleted ? "?" : displayName;

  return (
    <div
      style={{
        width: 1200,
        height: 630,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#111111",
        fontFamily: "Inter",
      }}
    >
      <div
        style={{
          width: CARD_W,
          display: "flex",
          flexDirection: "column",
          background: "#1c1c1c",
          borderRadius: 16,
          border: "1px solid rgba(255, 255, 255, 0.1)",
          padding: PAD,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Header row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 16,
          }}
        >
          <Avatar name={avatarName} size={44} />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
              flex: 1,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: isDeleted ? "#737373" : "#f5f5f5",
                  fontStyle: isDeleted ? "italic" : "normal",
                }}
              >
                {displayName}
              </span>
              <PostTypeBadge type={question.postType} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {question.chamberName && (
                <span style={{ fontSize: 13, color: "#a3a3a3" }}>
                  in {question.chamberName}
                </span>
              )}
              {(question.chamberName ? true : false) && (
                <span style={{ fontSize: 10, color: "#525252" }}>·</span>
              )}
              <span style={{ fontSize: 13, color: "#737373" }}>
                {timeAgo(question.timeCreated)}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              fontSize: 15,
              color: "#e5e5e5",
              lineHeight: 1.55,
              lineClamp: 5,
            }}
          >
            {truncatedContent}
          </span>
          {hasMore && (
            <span
              style={{
                fontSize: 13,
                color: "#737373",
                marginTop: 4,
              }}
            >
              Continue reading…
            </span>
          )}
        </div>

        {/* Metadata card (trade/partner/taxi) */}
        <MetadataCard question={question} />

        {/* Divider */}
        <div
          style={{
            marginTop: 20,
            height: 1,
            background: "rgba(255, 255, 255, 0.08)",
          }}
        />

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 16,
          }}
        >
          <div style={{ display: "flex", gap: 20, color: "#a3a3a3", fontSize: 14 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span>💬</span>
              <span>{question.repliesCount ?? 0}</span>
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span>▲</span>
              <span>{question.upvotes ?? 0}</span>
            </span>
          </div>

          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#ff5a1f",
              letterSpacing: "0.02em",
            }}
          >
            TurnsOut
          </span>
        </div>
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
