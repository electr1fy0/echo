import { API_URL } from "@/config";
import { getAuthHeaders } from "@/lib/utils";
import { parseApiError } from "@/lib/api-error";

export async function reportContent(targetType: "post" | "reply", targetUid: string) {
  const res = await fetch(`${API_URL}/reports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ targetType, targetUid }),
  });
  if (!res.ok) await parseApiError(res);
  return res.json() as Promise<{ uid: string }>;
}
