import type { Answer } from "@/types";
import { API_URL } from "@/config";

export async function fetchReplies(questionId: string): Promise<Answer[]> {
    const res = await fetch(
        `${API_URL}/questions/${encodeURIComponent(questionId)}/replies`,
    );
    if (!res.ok) throw new Error("Failed to fetch replies");
    return res.json();
}

export async function createReply(questionId: string, reply: Partial<Answer>) {
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
