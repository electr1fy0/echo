import type { QuestionDraft, QuestionItem } from "@/types";
import { API_URL } from "@/config";
import { getAuthHeaders } from "@/lib/utils";

export async function fetchQuestion(questionId: string) {
  const res = await fetch(
    `${API_URL}/questions/${encodeURIComponent(questionId)}`,
    {
      headers: {
        ...getAuthHeaders(),
      },
    },
  );
  if (!res.ok) throw new Error("Failed to fetch question");
  return res.json() as Promise<QuestionItem>;
}

export async function fetchQuestions(
  sort?: "votes" | "time_created",
  filter?: "joined",
  chamberId?: string,
  author?: string,
  limit?: number,
  offset?: number,
) {
  const params = new URLSearchParams({
    ...(sort ? { sort } : {}),
    ...(filter ? { filter } : {}),
    ...(chamberId ? { chamber_uid: chamberId } : {}),
    ...(author ? { author } : {}),
    ...(limit !== undefined ? { limit: limit.toString() } : {}),
    ...(offset !== undefined ? { offset: offset.toString() } : {}),
  });
  const res = await fetch(`${API_URL}/questions?${params}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error("Failed to fetch questions");
  return res.json() as Promise<QuestionItem[]>;
}

export async function fetchUserQuestions(limit?: number, offset?: number) {
  const params = new URLSearchParams({
    ...(limit !== undefined ? { limit: limit.toString() } : {}),
    ...(offset !== undefined ? { offset: offset.toString() } : {}),
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

export async function searchQuestions(query: string) {
  const params = new URLSearchParams({ q: query });
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

export async function updateQuestion(questionId: string, content: string) {
  const res = await fetch(
    `${API_URL}/questions/${encodeURIComponent(questionId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ content }),
    }
  );
  if (!res.ok) throw new Error("Failed to update question");
}

export async function pinQuestion(questionId: string) {
  const res = await fetch(
    `${API_URL}/questions/${encodeURIComponent(questionId)}/pin`,
    {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
      },
    }
  );
  if (!res.ok) throw new Error("Failed to pin question");
}

export async function unpinQuestion(questionId: string) {
  const res = await fetch(
    `${API_URL}/questions/${encodeURIComponent(questionId)}/pin`,
    {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
      },
    }
  );
  if (!res.ok) throw new Error("Failed to unpin question");
}
