import * as resvgMod from "@resvg/resvg-wasm";
import resvgWasm from "@resvg/resvg-wasm/index_bg.wasm";

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

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function wrapText(text: string, maxCharsPerLine: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length > maxCharsPerLine) {
      if (current) lines.push(current.trim());
      current = word;
    } else {
      current += (current ? " " : "") + word;
    }
    if (lines.length >= 3) break;
  }
  if (current.trim()) lines.push(current.trim());
  return lines.slice(0, 3);
}

function generateSvg(
  displayName: string,
  chamberName: string | undefined,
  content: string,
  fontDataBase64: string,
): string {
  const lines = wrapText(content, 55);
  const hasMore = content.length > lines.join(" ").length;

  const contentY = 280;
  const lineHeight = 52;

  const linesXml = lines
    .map((line, i) => `      <tspan x="64" dy="${i === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
    .join("\n");

  const readMore = hasMore
    ? `    <text x="64" y="${contentY + lines.length * lineHeight + 20}" font-family="Inter, sans-serif" font-size="18" fill="#a3a3a3">Continue reading\u2026</text>`
    : "";

  const nameWidthEst = displayName.length * 16;
  const chamberXml = chamberName
    ? `    <text x="${64 + nameWidthEst + 16}" y="110" font-family="Inter, sans-serif" font-size="26" fill="#a3a3a3">in ${escapeXml(chamberName)}</text>`
    : "";

  return `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @font-face {
        font-family: 'Inter';
        src: url(data:font/woff2;base64,${fontDataBase64}) format('woff2');
        font-weight: 400 700;
      }
    </style>
  </defs>
  <rect width="1200" height="630" fill="#FFFFFF"/>
  <text x="64" y="110" font-family="Inter, sans-serif" font-size="26" font-weight="600" fill="#171717">${escapeXml(displayName)}</text>
  ${chamberXml}
  <text x="64" y="${contentY}" font-family="Inter, sans-serif" font-size="36" font-weight="500" fill="#171717">
${linesXml}
  </text>
  ${readMore}
  <g transform="translate(1080, 510)">
    <rect width="56" height="56" rx="12" fill="#F54900"/>
    <rect x="13" y="16" width="30" height="4" rx="2" fill="#fff" opacity="0.3"/>
    <rect x="13" y="24" width="30" height="4" rx="2" fill="#fff" opacity="0.3"/>
    <rect x="13" y="32" width="30" height="4" rx="2" fill="#fff"/>
    <rect x="13" y="38" width="30" height="4" rx="2" fill="#fff"/>
  </g>
</svg>`;
}

let resvgInitPromise: Promise<void> | null = null;
let fontBase64: string | null = null;

function fetchWithTimeout(url: string, ms: number): Promise<Response> {
  return fetch(url, { signal: AbortSignal.timeout(ms) });
}

async function ensureDeps(url: URL) {
  if (!resvgInitPromise) {
    resvgInitPromise = (async () => {
      // resvgWasm is a pre-compiled WebAssembly.Module from the static import
      await resvgMod.initWasm(resvgWasm);
    })();
  }

  if (!fontBase64) {
    try {
      const fontUrl = `${url.protocol}//${url.host}/fonts/inter.woff2`;
      const fontData = await fetchWithTimeout(fontUrl, 10000).then((r) => r.arrayBuffer());
      const bytes = new Uint8Array(fontData);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      fontBase64 = btoa(binary);
    } catch {
      fontBase64 = "";
    }
  }

  await resvgInitPromise;

  return { fontBase64 };
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
      question: { content: string; isAnonymous?: boolean; authorUsername: string; chamberName?: string };
      author?: { username: string };
    };

    const { fontBase64: fontData } = await ensureDeps(url);
    if (!fontData) {
      return new Response("Font loading failed", { status: 500 });
    }

    const isDeleted = data.author?.username === "[deleted]";
    const displayName = data.question.isAnonymous
      ? "Anonymous"
      : isDeleted ? "[deleted]" : (data.author?.username || data.question.authorUsername);

    const cleanContent = stripHtml(data.question.content);
    const svg = generateSvg(displayName, data.question.chamberName, cleanContent, fontData);

    const r = new resvgMod.Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
    const pngBuffer = r.render().asPng();

    return new Response(pngBuffer, {
      headers: {
        "content-type": "image/png",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("OG image error:", err);
    return new Response("OG error: " + String(err), { status: 500 });
  }
}
