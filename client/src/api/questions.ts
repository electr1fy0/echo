import type { QuestionDraft, QuestionItem } from "@/types";
import { API_URL } from "@/config";
import { getAuthHeaders } from "@/lib/utils";

export async function fetchQuestions(
  offset: number,
  limit: number,
  sort?: "votes" | "time_created",
  filter?: "joined",
  chamberId?: string,
) {
  const params = new URLSearchParams({
    offset: offset.toString(),
    limit: limit.toString(),
    ...(sort ? { sort } : {}),
    ...(filter ? { filter } : {}),
    ...(chamberId ? { chamber_uid: chamberId } : {}),
  });

  const res = await fetch(`${API_URL}/questions?${params}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error("Failed to fetch questions");
  return res.json() as Promise<QuestionItem[]>;
}

export async function fetchUserQuestions(offset: number, limit: number) {
  const params = new URLSearchParams({
    offset: offset.toString(),
    limit: limit.toString(),
  });

  const res = await fetch(`${API_URL}/users/me/questions?${params}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error("Failed to fetch user questions");
  return res.json() as Promise<QuestionItem[]>;
}

export async function createQuestion(draft: QuestionDraft) {
  const res = await fetch(`${API_URL}/questions`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(draft),
  });

  if (!res.ok) throw new Error("Failed to create question");
}

export async function deleteQuestion(questionId: string) {
  const res = await fetch(
    `${API_URL}/questions/${encodeURIComponent(questionId)}`,
    {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
      },
    },
  );
  if (!res.ok) throw new Error("Failed to delete question");
}

export async function searchQuestions(query: string, offset = 0, limit = 500) {
  const params = new URLSearchParams({
    q: query,
    offset: offset.toString(),
    limit: limit.toString(),
  });

  const res = await fetch(`${API_URL}/questions/search?${params}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error("Failed to search questions");
  return res.json() as Promise<QuestionItem[]>;
}

export async function updateVotes(qid: string) {
  const res = await fetch(
    `${API_URL}/questions/${encodeURIComponent(qid)}/votes`,
    { 
      method: "post", 
      headers: {
        ...getAuthHeaders(),
      },
    },
  );
  if (!res.ok) throw new Error("Failed to update votes");
}
