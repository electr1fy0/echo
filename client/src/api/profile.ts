import { API_URL } from "@/config";
import { getAuthHeaders, setToken } from "@/lib/utils";
import type { User } from "@/types";
import { parseApiError } from "@/lib/api-error";
export async function fetchProfile(): Promise<User> {
  const res = await fetch(`${API_URL}/users/me`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) await parseApiError(res);
  return res.json() as Promise<User>;
}
export async function updateProfile(user: Partial<User>): Promise<void> {
  const res = await fetch(`${API_URL}/users/me`, {
    headers: {
      ...getAuthHeaders(),
    },
    method: "PATCH",
    body: JSON.stringify(user),
  });
  if (!res.ok) await parseApiError(res);
  
  const text = await res.text();
  if (text) {
    try {
      const data = JSON.parse(text);
      if (data.token) {
        setToken(data.token);
      }
    } catch {
      // Ignore parsing errors
    }
  }
}

export async function requestEmailChange(newEmail: string): Promise<void> {
  const res = await fetch(`${API_URL}/users/me/email-change`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ new_email: newEmail }),
  });
  if (!res.ok) await parseApiError(res);
  return res.json();
}

export async function confirmEmailChange(otp: string): Promise<void> {
  const res = await fetch(`${API_URL}/users/me/email-change/confirm`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ otp }),
  });
  if (!res.ok) await parseApiError(res);
  return res.json();
}

export async function fetchPublicProfile(username: string): Promise<User> {
  const res = await fetch(`${API_URL}/users/${username}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) await parseApiError(res);
  return res.json() as Promise<User>;
}
export async function followUser(username: string): Promise<void> {
  const res = await fetch(`${API_URL}/users/${username}/follow`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) await parseApiError(res);
}

export async function unfollowUser(username: string): Promise<void> {
  const res = await fetch(`${API_URL}/users/${username}/follow`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) await parseApiError(res);
}
