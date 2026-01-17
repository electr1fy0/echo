import { API_URL } from "@/config";

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
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("signin failed");
  }
  console.log(res);
  return res.text();
}

export async function signup(payload: AuthPayload) {
  const res = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("singup failed");
  }
  console.log(res);
  return res.text();
}

export async function verifySession() {
  const res = await fetch(`${API_URL}/auth/verify`, {
    method: "GET",
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error("verification failed");
  }
  return res.text();
}
