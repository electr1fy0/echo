import type { Question, QuestionDraft } from "@/types";
import { API_URL } from "@/config";

export async function fetchQuestions(offset: number, limit: number) {
  const params = new URLSearchParams({
    offset: offset.toString(),
    limit: limit.toString(),
  });

  const res = await fetch(`${API_URL}/questions?${params}`);
  if (!res.ok) throw new Error("Failed to fetch questions");
  return res.json() as Promise<Question[]>;
}

export async function fetchUserQuestions(offset: number, limit: number) {
  const params = new URLSearchParams({
    offset: offset.toString(),
    limit: limit.toString(),
  });

  const res = await fetch(`${API_URL}/users/questions?${params}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch user questions");
  return res.json() as Promise<Question[]>;
}

export async function createQuestion(draft: QuestionDraft) {
  const res = await fetch(`${API_URL}/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to create question");
}

export async function deleteQuestion(questionId: string) {
  const res = await fetch(
    `${API_URL}/questions/${encodeURIComponent(questionId)}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );
  if (!res.ok) throw new Error("Failed to delete question");
}
