import { parseApiError } from "@/lib/api-error";
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
  if (!res.ok) await parseApiError(res);
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
  if (!res.ok) await parseApiError(res);
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
  if (res.status === 401) {
    removeToken();
    throw new Error("Session expired");
  }
  if (!res.ok) {
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
  if (!res.ok) await parseApiError(res);
  const data = await res.json();
  if (data.token) {
    setToken(data.token);
  }
  return data;
}

export async function requestPasswordReset(email: string) {
  const res = await fetch(`${API_URL}/auth/request-password-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) await parseApiError(res);
  return res.json();
}

export async function resetPassword(token: string, newPassword: string) {
  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, new_password: newPassword }),
  });
  if (!res.ok) await parseApiError(res);
  return res.json();
}

export async function deleteAccount() {
  const res = await fetch(`${API_URL}/users/me`, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
    },
  });
  if (!res.ok) await parseApiError(res);
  return res.json();
}

export async function sendOtp(email: string) {
  const res = await fetch(`${API_URL}/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) await parseApiError(res);
  return res.json();
}

export async function verifyOtp(email: string, otp: string) {
  const res = await fetch(`${API_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
  if (!res.ok) await parseApiError(res);
  const data = await res.json();
  if (data.token) {
    setToken(data.token);
  }
  return data;
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

export async function completeOnboarding(token: string, username: string) {
  const res = await fetch(`${API_URL}/auth/onboarding`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, username }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || "Failed to complete onboarding");
  }
  const data = await res.json();
  if (data.token) {
    setToken(data.token);
  }
  return data;
}

export async function checkUsername(username: string) {
  const res = await fetch(`${API_URL}/auth/check-username?username=${encodeURIComponent(username)}`);
  return res.json() as Promise<{ available: boolean; error?: string }>;
}
