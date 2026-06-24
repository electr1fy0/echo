import { API_URL } from "@/config";
import { getAuthHeaders } from "@/lib/utils";
import type { UserSummary } from "@/types";
import { parseApiError } from "@/lib/api-error";

export async function searchUsers(query: string): Promise<UserSummary[]> {
  const params = new URLSearchParams({ q: query });
  const res = await fetch(`${API_URL}/users/search?${params}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) await parseApiError(res);
  return res.json();
}

export async function resolveUsers(usernames: string[]): Promise<string[]> {
  const res = await fetch(`${API_URL}/users/resolve`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ usernames }),
  });
  if (!res.ok) await parseApiError(res);
  const data = await res.json();
  return data.existing || [];
}
