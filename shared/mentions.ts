const mentionRegex = /@([a-zA-Z0-9_]+)/g;

export function extractMentions(content: string): string[] {
  const usernames = new Set<string>();
  for (const match of content.matchAll(mentionRegex)) {
    if (match[1]) usernames.add(match[1]);
  }
  return [...usernames];
}
