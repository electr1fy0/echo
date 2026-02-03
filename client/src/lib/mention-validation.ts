import { extractMentions } from "@/lib/mentions";
import { resolveUsers } from "@/api/users";

export async function validateMentions(content: string) {
  const mentions = extractMentions(content);
  if (mentions.length === 0) {
    return { mentions, missing: [] as string[] };
  }
  const existing = await resolveUsers(mentions);
  const existingSet = new Set(existing);
  const missing = mentions.filter((username) => !existingSet.has(username));
  return { mentions, missing };
}
