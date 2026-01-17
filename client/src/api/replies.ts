import type { Reply } from "@/types";
import { API_URL } from "@/config";

export async function fetchReplies(questionId: string): Promise<Reply[]> {
  const res = await fetch(
    `${API_URL}/questions/${encodeURIComponent(questionId)}/replies`,
  );
  if (!res.ok) throw new Error("Failed to fetch replies");
  return res.json();
}

export async function createReply(questionId: string, reply: Partial<Reply>) {
  const res = await fetch(
    `${API_URL}/questions/${encodeURIComponent(questionId)}/replies`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reply),
    },
  );
  if (!res.ok) throw new Error("Failed to create reply");
}

export async function deleteReply(
  questionID: string,
  replyId: string,
): Promise<void> {
  const res = await fetch(
    `${API_URL}/questions/${encodeURIComponent(questionID)}/replies/${encodeURIComponent(replyId)}`,
    {
      method: "DELETE",
    },
  );
  if (!res.ok) throw new Error("failed to delete reply");
}
