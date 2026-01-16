import type { Question } from "@/types";
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

export async function createQuestion(question: Partial<Question>) {
  const res = await fetch(`${API_URL}/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(question),
  });

  if (!res.ok) throw new Error("Failed to create question");
}
