import { API_URL } from "@/config";
import { getAuthHeaders, removeToken, setToken } from "@/lib/utils";
import type { User } from "@/types";
export type AuthPayload = {
  username: string;
  email: string;
  password: string;
};
export async function signin(payload: AuthPayload) {
  const res = await fetch(`${API_URL}/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Incorrect user or password");
  }
  const data = await res.json();
  if (data.token) {
    setToken(data.token);
  }
  return data;
}
export async function signup(payload: AuthPayload) {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "signup failed");
  }
  return res.json();
}
export async function signout() {
  removeToken();
  const res = await fetch(`${API_URL}/auth/signout`, {
    method: "POST",
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) {
    console.error("signout failed on server");
  }
  return res.text();
}
export async function verifySession() {
  const headers = getAuthHeaders();
  if (!headers.Authorization) {
    throw new Error("No token found");
  }
  const res = await fetch(`${API_URL}/auth/verify`, {
    method: "GET",
    headers: headers,
  });
  if (!res.ok) {
    removeToken();
    throw new Error("verification failed");
  }
  return res.json() as Promise<User>;
}
export async function verifyEmail(token: string) {
  const res = await fetch(`${API_URL}/auth/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "verification failed");
  }
  return res.json();
}
