import { API_URL } from "@/config";
import { getAuthHeaders } from "@/lib/utils";
import type { Chamber, QuestionItem, AnswerItem } from "@/types";
export interface SearchResponse {
    chambers: Chamber[];
    questions: QuestionItem[];
    replies: AnswerItem[];
}
export async function globalSearch(query: string): Promise<SearchResponse> {
    const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(query)}`, {
        method: "GET",
        headers: {
            ...getAuthHeaders(),
        },
    });
    if (!res.ok) throw new Error("failed to search");
    return res.json();
}
