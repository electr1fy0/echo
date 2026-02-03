import { Link } from "react-router";
import { cn } from "@/lib/utils";

type MentionTextProps = {
  content: string;
  className?: string;
};

const mentionRegex = /@([a-zA-Z0-9_]+)/g;

function renderPlainText(text: string, keyPrefix: string) {
  if (text.length === 0) return [];
  const parts = text.split("\n");
  return parts.flatMap((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (index === 0) return [part];
    return [<br key={`${key}-br`} />, part];
  });
}

export function MentionText({ content, className }: MentionTextProps) {
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = mentionRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(
        ...renderPlainText(
          content.slice(lastIndex, match.index),
          `text-${index}`,
        ),
      );
    }
    const username = match[1];
    nodes.push(
      <Link
        key={`mention-${index}-${username}`}
        to={`/u/${username}`}
        className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[0.85em] font-medium text-primary bg-primary/10 hover:bg-primary/15 dark:bg-primary/15 dark:hover:bg-primary/20 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        @{username}
      </Link>,
    );
    lastIndex = match.index + match[0].length;
    index += 1;
  }

  if (lastIndex < content.length) {
    nodes.push(
      ...renderPlainText(content.slice(lastIndex), `text-${index}`),
    );
  }

  return <span className={cn("whitespace-pre-wrap", className)}>{nodes}</span>;
}
