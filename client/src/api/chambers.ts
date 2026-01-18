import { API_URL } from "@/config";
import { getAuthHeaders } from "@/lib/utils";
import type { Chamber } from "@/types";
export async function createChamber(chamber: Chamber): Promise<Chamber> {
  const res = await fetch(`${API_URL}/chambers`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
    body: JSON.stringify(chamber),
  });
  if (!res.ok) throw new Error("failed to create chamber");
  return res.json();
}
export async function listChambers(query?: string): Promise<Chamber[]> {
  const url = query
    ? `${API_URL}/chambers?q=${encodeURIComponent(query)}`
    : `${API_URL}/chambers`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error("failed to list chambers");
  return res.json();
}
export async function joinChamber(uid: string): Promise<void> {
  const res = await fetch(`${API_URL}/chambers/${uid}/join`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error("failed to join chamber");
}
export async function leaveChamber(uid: string): Promise<void> {
  const res = await fetch(`${API_URL}/chambers/${uid}/leave`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) throw new Error("failed to leave chamber");
}
