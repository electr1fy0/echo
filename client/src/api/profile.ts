import { API_URL } from "@/config";
import type { User } from "@/types";

export async function fetchProfile(): Promise<User> {
  const res = await fetch(`${API_URL}/users`, {
    credentials: "include",
  });

  if (!res.ok) throw new Error("Failed to fetch profile");

  return res.json() as Promise<User>;
}

export async function updateProfile(user: User): Promise<void> {
  const res = await fetch(`${API_URL}/users`, {
    credentials: "include",
    method: "PATCH",
    body: JSON.stringify(user),
  });

  if (!res.ok) throw new Error("Failed to update profile");
}
