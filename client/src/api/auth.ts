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

export async function requestPasswordReset(email: string) {
  const res = await fetch(`${API_URL}/auth/request-password-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to request password reset");
  }
  return res.json();
}

export async function resetPassword(token: string, newPassword: string) {
  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password: newPassword }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to reset password");
  }
  return res.json();
}

export async function deleteAccount() {
  const res = await fetch(`${API_URL}/users/me`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to delete account");
  }
  return res.json();
}

export async function resendVerification(email: string) {
  const res = await fetch(`${API_URL}/auth/resend-verification`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to resend verification email");
  }
  return res.json();
}
