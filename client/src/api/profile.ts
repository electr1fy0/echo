import { API_URL } from "@/config";
import { getAuthHeaders, setToken } from "@/lib/utils";
import type { User } from "@/types";
export async function fetchProfile(): Promise<User> {
  const res = await fetch(`${API_URL}/users/me`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json() as Promise<User>;
}
export async function updateProfile(user: User): Promise<void> {
  const res = await fetch(`${API_URL}/users/me`, {
    headers: {
      ...getAuthHeaders(),
    },
    method: "PATCH",
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error("Failed to update profile");
  
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

export async function fetchPublicProfile(username: string): Promise<User> {
  const res = await fetch(`${API_URL}/users/${username}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json() as Promise<User>;
}

export async function followUser(username: string): Promise<void> {
  const res = await fetch(`${API_URL}/users/${username}/follow`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Failed to follow user");
}

export async function unfollowUser(username: string): Promise<void> {
  const res = await fetch(`${API_URL}/users/${username}/follow`, {
    method: "DELETE",
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) throw new Error("Failed to unfollow user");
}
