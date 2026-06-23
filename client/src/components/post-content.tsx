import { Link } from "react-router";
import { cn } from "@/lib/utils";
import { ImageCarousel } from "@/components/image-carousel";

type PostContentProps = {
  content: string;
  className?: string;
};

const mentionRegex = /@([a-zA-Z0-9_]+)/g;
const imageUrlRegex = /https?:\/\/[^\s]+\.(jpg|jpeg|png|webp|avif|gif)(\?[^\s]*)?/gi;

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
        className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[0.85em] font-medium text-primary bg-primary/10 hover:bg-primary/15 transition-colors"
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
  | { type: "image"; url: string };

function tokenize(content: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;

  const allMatches: { index: number; url: string }[] = [];
  let m: RegExpExecArray | null;

  imageUrlRegex.lastIndex = 0;
  while ((m = imageUrlRegex.exec(content)) !== null) {
    allMatches.push({ index: m.index, url: m[0] });
  }

  if (allMatches.length === 0) {
    return [{ type: "text", content }];
  }

  for (const match of allMatches) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: content.slice(lastIndex, match.index) });
    }
    segments.push({ type: "image", url: match.url });
    lastIndex = match.index + match.url.length;
  }

  if (lastIndex < content.length) {
    segments.push({ type: "text", content: content.slice(lastIndex) });
  }

  return segments;
}

export function PostContent({ content, className }: PostContentProps) {
  const segments = tokenize(content);

  const nodes: React.ReactNode[] = [];
  let imageGroup: string[] = [];
  let keyIndex = 0;

  for (const seg of segments) {
    if (seg.type === "image") {
      imageGroup.push(seg.url);
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

  return <span className={cn("whitespace-pre-wrap", className)}>{nodes}</span>;
}
