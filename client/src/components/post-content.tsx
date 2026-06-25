import { useEffect, useState, useRef } from "react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";
import { ImageCarousel } from "@/components/image-carousel";
import { fetchLinkPreview, type LinkPreviewData } from "@/api/link-previews";

type PostContentProps = {
  content: string;
  className?: string;
  showPreviews?: boolean;
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

function useLinkPreview(url: string) {
  const [data, setData] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef<string | null>(null);

  useEffect(() => {
    if (fetchedRef.current === url) return;
    fetchedRef.current = url;
    setLoading(true);
    fetchLinkPreview(url).then((d) => {
      setData(d);
      setLoading(false);
    });
  }, [url]);

  return { data, loading };
}

function LinkPreview({ url }: { url: string }) {
  let hostname = "";
  try {
    hostname = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    hostname = url;
  }

  const { data, loading } = useLinkPreview(url);
  const faviconUrl = `https://www.google.com/s2/favicons?sz=128&domain=${hostname}`;

  if (loading) {
    return (
      <div className="flex items-center gap-2.5 p-2.5 my-1 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/20 dark:bg-neutral-950/10 rounded-2xl max-w-sm shadow-sm">
        <div className="size-8 rounded-lg bg-neutral-200 dark:bg-neutral-800 animate-pulse shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-2.5 w-24 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
          <div className="h-2 w-36 bg-neutral-200 dark:bg-neutral-800 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (data?.title) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col my-1 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-350 dark:hover:border-neutral-700 bg-white dark:bg-neutral-900/60 rounded-2xl overflow-hidden transition-all duration-200 max-w-sm group cursor-pointer shadow-sm active:scale-[0.99]"
      >
        {data.image && (
          <div className="relative w-full aspect-[2.4/1] bg-neutral-100 dark:bg-neutral-850 overflow-hidden">
            <img
              src={data.image}
              alt=""
              className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
        )}
        <div className="flex items-start gap-2.5 p-2.5">
          <div className="size-8 rounded-lg bg-white dark:bg-neutral-850 border border-neutral-200/60 dark:border-neutral-800 flex items-center justify-center shrink-0 shadow-sm">
            <img
              src={faviconUrl}
              alt=""
              className="size-3.5 object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2 leading-snug group-hover:text-[var(--brand)] transition-colors">
              {data.title}
            </div>
            {data.description && (
              <div className="text-[10px] text-neutral-500 dark:text-neutral-400 line-clamp-2 mt-0.5 leading-relaxed">
                {data.description}
              </div>
            )}
          </div>
        </div>
      </a>
    );
  }

  return null;
}

export function PostContent({ content, className, showPreviews = true }: PostContentProps) {
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
          className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-0.5 break-all"
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
      {showPreviews && uniqueUrls.length > 0 && (
        <span className="flex flex-col gap-2 mt-2.5 empty:hidden" onClick={(e) => e.stopPropagation()}>
          {uniqueUrls.map((url, i) => (
            <LinkPreview key={`preview-${i}`} url={url} />
          ))}
        </span>
      )}
    </span>
  );
}
