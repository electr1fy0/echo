import { API_URL } from "@/config";
import { getAuthHeaders } from "@/lib/utils";
import type { Conversation, Message } from "@/types";

export async function fetchConversations() {
  const res = await fetch(`${API_URL}/dms/conversations`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch conversations");
  return res.json() as Promise<Conversation[]>;
}

export async function createConversation(username: string) {
  const res = await fetch(`${API_URL}/dms/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || data.message || "Failed to create conversation");
  }
  return res.json() as Promise<Conversation>;
}

export async function fetchMessages(conversationUid: string, limit = 50, offset = 0) {
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });
  const res = await fetch(`${API_URL}/dms/conversations/${conversationUid}/messages?${params}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json() as Promise<Message[]>;
}

export async function sendMessage(conversationUid: string, content: string) {
  const res = await fetch(`${API_URL}/dms/conversations/${conversationUid}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json() as Promise<Message>;
}
