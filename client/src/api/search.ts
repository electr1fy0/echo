import { API_URL } from "@/config";
import { getAuthHeaders } from "@/lib/utils";
import type { SearchResponse } from "@/types";
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
