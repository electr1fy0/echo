import { API_URL } from "@/config";
import { getAuthHeaders } from "@/lib/utils";
import type { Chamber } from "@/types";
import { parseApiError } from "@/lib/api-error";
export async function createChamber(chamber: Chamber): Promise<Chamber> {
  const res = await fetch(`${API_URL}/chambers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(chamber),
  });
  if (!res.ok) await parseApiError(res);
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
  if (!res.ok) await parseApiError(res);
  return res.json();
}
export async function joinChamber(uid: string): Promise<void> {
  const res = await fetch(`${API_URL}/chambers/${uid}/join`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) await parseApiError(res);
}
export async function leaveChamber(uid: string): Promise<void> {
  const res = await fetch(`${API_URL}/chambers/${uid}/leave`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) await parseApiError(res);
}

export async function updateChamber(uid: string, chamber: Chamber): Promise<void> {
  const res = await fetch(`${API_URL}/chambers/${uid}`, {
    method: "PATCH",
    headers: {
      ...getAuthHeaders(),
    },
    body: JSON.stringify(chamber),
  });
  if (!res.ok) await parseApiError(res);
}

export async function deleteChamber(name: string): Promise<void> {
  const res = await fetch(`${API_URL}/chambers`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) await parseApiError(res);
}

export async function listChannels(chamberUid: string): Promise<any[]> {
  const res = await fetch(`${API_URL}/chambers/${chamberUid}/channels`, {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) await parseApiError(res);
  return res.json();
}

export async function createChannel(chamberUid: string, channel: { name: string; icon?: string; schema?: any[] }): Promise<any> {
  const res = await fetch(`${API_URL}/chambers/${chamberUid}/channels`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(channel),
  });
  if (!res.ok) await parseApiError(res);
  return res.json();
}

export async function updateChannel(
  chamberUid: string,
  channelUid: string,
  channel: { name?: string; icon?: string; schema?: any[] }
): Promise<any> {
  const res = await fetch(`${API_URL}/chambers/${chamberUid}/channels/${channelUid}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(channel),
  });
  if (!res.ok) await parseApiError(res);
  return res.json();
}

export async function deleteChannel(chamberUid: string, channelUid: string): Promise<void> {
  const res = await fetch(`${API_URL}/chambers/${chamberUid}/channels/${channelUid}`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) await parseApiError(res);
}

export async function listAllChannels(joinedOnly?: boolean): Promise<any[]> {
  const url = joinedOnly
    ? `${API_URL}/chambers/all-channels?joined_only=true`
    : `${API_URL}/chambers/all-channels`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) await parseApiError(res);
  return res.json();
}
