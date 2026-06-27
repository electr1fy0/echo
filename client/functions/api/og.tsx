/** @jsxImportSource satori/jsx */
import satori from "satori";
import { initWasm, Resvg } from "@resvg/resvg-wasm";
import initYoga from "yoga-wasm-web";

let yogaPromise: Promise<unknown> | null = null;
async function getYoga() {
  if (!yogaPromise) {
    yogaPromise = initYoga().catch((err) => {
      yogaPromise = null;
      throw err;
    });
  }
  return yogaPromise;
}

let resvgInitPromise: Promise<void> | null = null;
async function ensureResvg(url: URL) {
  if (!resvgInitPromise) {
    resvgInitPromise = (async () => {
      const wasmUrl = `${url.protocol}//${url.host}/resvg.wasm`;
      const wasmBytes = await fetch(wasmUrl).then((r) => r.arrayBuffer());
      await initWasm(wasmBytes);
    })().catch((err) => {
      resvgInitPromise = null;
      throw err;
    });
  }
  return resvgInitPromise;
}

let fontsPromise: Promise<{ name: string; data: ArrayBuffer; weight: number; style: "normal" }[]> | null = null;
async function loadFonts() {
  if (!fontsPromise) {
    fontsPromise = (async () => {
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

      return results.filter(Boolean) as { name: string; data: ArrayBuffer; weight: number; style: "normal" }[];
    })();
  }
  return fontsPromise;
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

const PAD = 64;

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

function PostCard({ question, author }: { question: QuestionData; author?: AuthorData }) {
  const isDeleted = author?.username === "[deleted]";
  const displayName = question.isAnonymous
    ? "Anonymous"
    : isDeleted ? "[deleted]" : (author?.username || question.authorUsername);

  const cleanContent = stripHtml(question.content);
  const truncatedContent = truncate(cleanContent, 250);
  const hasMore = cleanContent.length > 250;

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
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 26, fontWeight: 600, color: "#171717" }}>
          {displayName}
        </span>
        {question.chamberName && (
          <span style={{ fontSize: 26, color: "#a3a3a3" }}>
            in {question.chamberName}
          </span>
        )}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <span style={{ fontSize: 36, fontWeight: 500, color: "#171717", lineHeight: 1.4 }}>
          {truncatedContent}
        </span>
        {hasMore && (
          <span style={{ fontSize: 18, color: "#a3a3a3", marginTop: 14 }}>
            Continue reading…
          </span>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{
          width: 56, height: 56, background: "#F54900", borderRadius: 12,
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 5,
        }}>
          <div style={{ width: 30, height: 5, background: "#fff", borderRadius: 2, opacity: 0.3 }} />
          <div style={{ width: 30, height: 5, background: "#fff", borderRadius: 2, opacity: 0.3 }} />
          <div style={{ width: 30, height: 5, background: "#fff", borderRadius: 2 }} />
          <div style={{ width: 30, height: 5, background: "#fff", borderRadius: 2 }} />
        </div>
      </div>
    </div>
  );
}

export async function onRequest(context: EventContext<unknown, unknown, Record<string, string>>) {
  const { request, env } = context;

  try {
    const url = new URL(request.url);
    const questionId = url.searchParams.get("questionId");
    if (!questionId) {
      return new Response("Missing questionId", { status: 400 });
    }

    const apiUrl = (env as Record<string, string | undefined>).VITE_ECHO_URL || "http://localhost:8787";

    const res = await fetch(`${apiUrl}/questions/${encodeURIComponent(questionId)}`, {
      headers: { "User-Agent": "TurnsOut-OG/1.0" },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      return new Response("Post not found", { status: 404 });
    }

    const data = (await res.json()) as {
      question: QuestionData;
      author?: AuthorData;
    };

    const [fonts, yoga] = await Promise.all([loadFonts(), getYoga(), ensureResvg(url)]);

    const svg = await satori(
      <PostCard question={data.question} author={data.author} />,
      {
        width: 1200,
        height: 630,
        fonts,
        yogaModule: yoga,
      },
    );

    const resvg = new Resvg(svg, {
      fitTo: { mode: "width", value: 1200 },
    });
    const pngBuffer = resvg.render().asPng();

    return new Response(pngBuffer, {
      headers: {
        "content-type": "image/png",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("OG image error:", err);
    return new Response("Failed to generate OG image", { status: 500 });
  }
}
