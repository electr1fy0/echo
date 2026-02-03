import type { AnswerItem, Reply } from "@/types";
import { API_URL } from "@/config";
import { getAuthHeaders } from "@/lib/utils";
export async function fetchReplies(questionId: string): Promise<AnswerItem[]> {
  const res = await fetch(
    `${API_URL}/questions/${encodeURIComponent(questionId)}/replies`,
    {
      headers: {
        ...getAuthHeaders(),
      },
    },
  );
  if (!res.ok) throw new Error("Failed to fetch replies");
  return res.json();
}
export async function createReply(questionId: string, reply: Partial<Reply>) {
  const res = await fetch(
    `${API_URL}/questions/${encodeURIComponent(questionId)}/replies`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
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
      headers: {
        ...getAuthHeaders(),
      },
    },
  );
  if (!res.ok) throw new Error("failed to delete reply");
}
export async function updateReplyVotes(qid: string, rid: string) {
  const res = await fetch(
    `${API_URL}/questions/${encodeURIComponent(qid)}/replies/${encodeURIComponent(rid)}/votes`,
    {
      method: "post",
      headers: {
        ...getAuthHeaders(),
      },
    },
  );
  if (!res.ok) throw new Error("Failed to update votes");
}

export async function updateReply(
  qid: string,
  rid: string,
  content: string,
): Promise<void> {
  const res = await fetch(
    `${API_URL}/questions/${encodeURIComponent(qid)}/replies/${encodeURIComponent(rid)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ content }),
    },
  );
  if (!res.ok) throw new Error("failed to update reply");
}

export async function acceptReply(qid: string, rid: string) {
  const res = await fetch(
    `${API_URL}/questions/${encodeURIComponent(qid)}/replies/${encodeURIComponent(rid)}/accept`,
    {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
      },
    },
  );
  if (!res.ok) throw new Error("failed to accept reply");
}

export async function unacceptReply(qid: string, rid: string) {
  const res = await fetch(
    `${API_URL}/questions/${encodeURIComponent(qid)}/replies/${encodeURIComponent(rid)}/accept`,
    {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
      },
    },
  );
  if (!res.ok) throw new Error("failed to unaccept reply");
}
