import type { QuestionItem } from "@/types";
import { API_URL } from "@/config";
import { getAuthHeaders } from "@/lib/utils";
import { parseApiError } from "@/lib/api-error";

export async function fetchBookmarks(limit?: number, offset?: number, query?: string) {
  const params = new URLSearchParams({
    ...(limit !== undefined ? { limit: limit.toString() } : {}),
    ...(offset !== undefined ? { offset: offset.toString() } : {}),
    ...(query ? { q: query } : {}),
  });
  const res = await fetch(`${API_URL}/bookmarks?${params}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) await parseApiError(res);
  return res.json() as Promise<QuestionItem[]>;
}

export async function bookmarkPost(postUid: string) {
  const res = await fetch(
    `${API_URL}/bookmarks/${encodeURIComponent(postUid)}`,
    {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
      },
    },
  );
  if (!res.ok) await parseApiError(res);
}

export async function unbookmarkPost(postUid: string) {
  const res = await fetch(
    `${API_URL}/bookmarks/${encodeURIComponent(postUid)}`,
    {
      method: "DELETE",
      headers: {
        ...getAuthHeaders(),
      },
    },
  );
  if (!res.ok) await parseApiError(res);
}
