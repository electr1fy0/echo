import { API_URL } from "@/config";
import { getAuthHeaders } from "@/lib/utils";
import { parseApiError } from "@/lib/api-error";
export interface Notification {
    uid: string;
    user_username: string;
    actor_username: string;
    actor_avatar: string;
    actor_is_anonymous?: boolean;
    type: string;
    reference_uid: string;
    post_uid: string;
    content: string;
    question_content?: string;
    is_read: boolean;
    created_at: string;
}
export async function listNotifications(limit?: number, offset?: number): Promise<Notification[]> {
    const params = new URLSearchParams({
        ...(limit !== undefined ? { limit: limit.toString() } : {}),
        ...(offset !== undefined ? { offset: offset.toString() } : {}),
    });
    const res = await fetch(`${API_URL}/users/me/notifications?${params}`, {
        method: "GET",
        headers: {
            ...getAuthHeaders(),
        },
    });
    if (!res.ok) await parseApiError(res);
    return res.json();
}

export async function markNotificationsRead(): Promise<void> {
  await fetch(`${API_URL}/users/me/notifications/read`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
  });
}

export async function getUnreadNotificationCount(): Promise<number> {
    const res = await fetch(`${API_URL}/users/me/notifications/unread-count`, {
        headers: { ...getAuthHeaders() },
    });
    if (!res.ok) await parseApiError(res);
    const { count } = await res.json();
    return count;
}
