import { Link } from "react-router";
import { cn } from "@/lib/utils";
import { ImageCarousel } from "@/components/image-carousel";

type PostContentProps = {
  content: string;
  className?: string;
};

const mentionRegex = /@([a-zA-Z0-9_]+)/g;

function renderMentions(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  mentionRegex.lastIndex = 0;
  while ((match = mentionRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(...renderLines(text.slice(lastIndex, match.index), `${keyPrefix}-t-${i}`));
    }
    nodes.push(
      <Link
        key={`${keyPrefix}-m-${i}`}
        to={`/u/${match[1]}`}
        className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[0.85em] font-semibold text-primary bg-primary/10 hover:bg-primary/15 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {match[0]}
      </Link>,
    );
    lastIndex = match.index + match[0].length;
    i++;
  }

  if (lastIndex < text.length) {
    nodes.push(...renderLines(text.slice(lastIndex), `${keyPrefix}-t-${i}`));
  }

  return nodes;
}

function renderLines(text: string, key: string): React.ReactNode[] {
  if (!text) return [];
  return text.split("\n").flatMap((part, i) => {
    if (i === 0) return [part];
    return [<br key={`${key}-br-${i}`} />, part];
  });
}

type Segment =
  | { type: "text"; content: string }
  | { type: "image"; url: string }
  | { type: "url"; url: string };

function tokenize(content: string): Segment[] {
  const segments: Segment[] = [];
  const generalUrlRegex = /(https?:\/\/[^\s]+)/gi;
  const imageExtensions = /\.(jpg|jpeg|png|webp|avif|gif|svg)(\?[^\s]*)?$/i;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  generalUrlRegex.lastIndex = 0;
  while ((match = generalUrlRegex.exec(content)) !== null) {
    const url = match[0];
    const matchIndex = match.index;

    if (matchIndex > lastIndex) {
      segments.push({ type: "text", content: content.slice(lastIndex, matchIndex) });
    }

    const cleanUrl = url.split("?")[0];
    if (imageExtensions.test(cleanUrl)) {
      segments.push({ type: "image", url });
    } else {
      segments.push({ type: "url", url });
    }

    lastIndex = matchIndex + url.length;
  }

  if (lastIndex < content.length) {
    segments.push({ type: "text", content: content.slice(lastIndex) });
  }

  return segments;
}

function LinkPreview({ url }: { url: string }) {
  let hostname = "";
  try {
    hostname = new URL(url).hostname;
  } catch {
    hostname = url;
  }

  const faviconUrl = `https://www.google.com/s2/favicons?sz=128&domain=${hostname}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-3.5 p-3 my-1 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-350 dark:hover:border-neutral-700 bg-neutral-50/20 hover:bg-neutral-100/50 dark:bg-neutral-950/10 dark:hover:bg-neutral-900/35 rounded-2xl transition-all duration-200 text-left select-none max-w-md group cursor-pointer shadow-sm active:scale-[0.99]"
    >
      <div className="size-10 rounded-xl bg-white dark:bg-neutral-850 border border-neutral-200/60 dark:border-neutral-800 flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105 duration-200">
        <img
          src={faviconUrl}
          alt=""
          className="size-5 object-contain"
          onError={(e) => {
            (e.target as HTMLElement).style.display = "none";
          }}
        />
      </div>
      <div className="flex-1 min-w-0 pr-1">
        <div className="text-[11px] font-bold text-neutral-800 dark:text-neutral-200 truncate group-hover:text-[var(--brand)] transition-colors">
          {hostname}
        </div>
        <div className="text-[10px] text-neutral-450 dark:text-neutral-500 font-medium truncate mt-0.5">
          {url}
        </div>
      </div>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-3.5 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-250 transition-colors shrink-0"
      >
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </a>
  );
}

export function PostContent({ content, className }: PostContentProps) {
  const segments = tokenize(content);

  const nodes: React.ReactNode[] = [];
  let imageGroup: string[] = [];
  let keyIndex = 0;

  for (const seg of segments) {
    if (seg.type === "image") {
      imageGroup.push(seg.url);
    } else if (seg.type === "url") {
      if (imageGroup.length > 0) {
        nodes.push(<ImageCarousel key={`img-${keyIndex++}`} urls={imageGroup} className="my-2" />);
        imageGroup = [];
      }
      
      let displayUrl = seg.url;
      try {
        const parsed = new URL(seg.url);
        displayUrl = parsed.hostname + (parsed.pathname !== "/" ? parsed.pathname.slice(0, 15) + (parsed.pathname.length > 15 ? "..." : "") : "");
      } catch {}

      nodes.push(
        <a
          key={`url-${keyIndex++}`}
          href={seg.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[var(--brand)] hover:underline inline-flex items-center gap-0.5 font-semibold break-all"
        >
          {displayUrl}
        </a>
      );
    } else {
      const isWhitespace = seg.content.trim() === "";
      if (imageGroup.length > 0 && isWhitespace) continue;
      if (imageGroup.length > 0) {
        nodes.push(<ImageCarousel key={`img-${keyIndex++}`} urls={imageGroup} className="my-2" />);
        imageGroup = [];
      }
      nodes.push(
        <span key={`txt-${keyIndex++}`} className="inline">
          {renderMentions(seg.content, `pc-${keyIndex}`)}
        </span>,
      );
    }
  }

  if (imageGroup.length > 0) {
    nodes.push(<ImageCarousel key={`img-${keyIndex++}`} urls={imageGroup} className="my-2" />);
  }

  // Generate unique URL bookmarks at the bottom
  const uniqueUrls = Array.from(
    new Set(
      segments
        .filter((s): s is { type: "url"; url: string } => s.type === "url")
        .map((s) => s.url)
    )
  );

  return (
    <span className={cn("whitespace-pre-wrap block", className)}>
      {nodes}
      {uniqueUrls.length > 0 && (
        <span className="flex flex-col gap-2 mt-2.5 empty:hidden" onClick={(e) => e.stopPropagation()}>
          {uniqueUrls.map((url, i) => (
            <LinkPreview key={`preview-${i}`} url={url} />
          ))}
        </span>
      )}
    </span>
  );
}
