import { API_URL } from "@/config";

export interface Notification {
    uid: string;
    user_username: string;
    actor_username: string;
    actor_avatar: string;
    type: string;
    reference_uid: string;
    content: string;
    is_read: boolean;
    created_at: string;
}

export async function listNotifications(): Promise<Notification[]> {
    const res = await fetch(`${API_URL}/users/me/notifications`, {
        method: "GET",
        credentials: "include",
    });
    if (!res.ok) throw new Error("failed");
    return res.json();
}
