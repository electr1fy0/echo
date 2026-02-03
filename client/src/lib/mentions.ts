export type MentionContext = {
  query: string;
  start: number;
  end: number;
};

const mentionRegex = /@([a-zA-Z0-9_]+)/g;

export function getMentionContext(
  value: string,
  cursor: number | null,
): MentionContext | null {
  if (cursor === null) return null;
  const uptoCursor = value.slice(0, cursor);
  const atIndex = uptoCursor.lastIndexOf("@");
  if (atIndex < 0) return null;
  if (atIndex > 0 && !/\s/.test(uptoCursor[atIndex - 1])) return null;
  const fragment = uptoCursor.slice(atIndex + 1);
  if (/\s/.test(fragment)) return null;
  if (fragment.length === 0) return null;
  if (!/^[a-zA-Z0-9_]+$/.test(fragment)) return null;
  return {
    query: fragment,
    start: atIndex,
    end: cursor,
  };
}

export function applyMention(
  value: string,
  ctx: MentionContext,
  username: string,
) {
  const before = value.slice(0, ctx.start);
  const after = value.slice(ctx.end);
  const mentionText = `@${username} `;
  return {
    value: `${before}${mentionText}${after}`,
    cursor: before.length + mentionText.length,
  };
}

export function extractMentions(content: string) {
  const matches = content.matchAll(mentionRegex);
  const out = new Set<string>();
  for (const match of matches) {
    if (match[1]) out.add(match[1]);
  }
  return Array.from(out);
}
