import { API_URL } from "@/config";
import { getAuthHeaders } from "@/lib/utils";
import type { Conversation, Message } from "@/types";
import { parseApiError } from "@/lib/api-error";

export async function fetchConversations() {
  const res = await fetch(`${API_URL}/dms/conversations`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) await parseApiError(res);
  return res.json() as Promise<Conversation[]>;
}

export async function createConversation(username: string) {
  const res = await fetch(`${API_URL}/dms/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) await parseApiError(res);
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
  if (!res.ok) await parseApiError(res);
  return res.json() as Promise<Message[]>;
}

export async function markConversationRead(conversationUid: string): Promise<void> {
  await fetch(`${API_URL}/dms/conversations/${conversationUid}/read`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
  });
}

export async function getUnreadMessageCount(): Promise<number> {
  const res = await fetch(`${API_URL}/dms/unread-count`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) await parseApiError(res);
  const { count } = await res.json();
  return count;
}

export async function editMessage(conversationUid: string, messageUid: string, content: string) {
  const res = await fetch(`${API_URL}/dms/conversations/${conversationUid}/messages/${messageUid}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) await parseApiError(res);
  return res.json() as Promise<Message>;
}

export async function deleteMessage(conversationUid: string, messageUid: string) {
  const res = await fetch(`${API_URL}/dms/conversations/${conversationUid}/messages/${messageUid}`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) await parseApiError(res);
}

export async function sendMessage(conversationUid: string, content: string) {
  const res = await fetch(`${API_URL}/dms/conversations/${conversationUid}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) await parseApiError(res);
  return res.json() as Promise<Message>;
}
