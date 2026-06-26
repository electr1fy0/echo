import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import ms from "ms";

export function formatTimeAgo(date: string | Date) {
  const diff = Date.now() - new Date(date).getTime();
  if (diff < 60_000) return "now";

  const days = Math.floor(diff / 86_400_000);
  if (days >= 365) return `${Math.floor(days / 365)}y`;
  if (days >= 30) return `${Math.floor(days / 30)}mo`;
  if (days >= 7) return `${Math.floor(days / 7)}w`;

  return ms(diff, { long: false });
}
const GOOGLE_ONBOARDING_TOKEN_KEY = "google_onboarding_token";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function getToken() {
  return localStorage.getItem("token");
}
export function setToken(token: string) {
  localStorage.setItem("token", token);
  window.dispatchEvent(new Event("auth-token-change"));
}
export function removeToken() {
  localStorage.removeItem("token");
  window.dispatchEvent(new Event("auth-token-change"));
}
export function setGoogleOnboardingToken(token: string) {
  localStorage.setItem(GOOGLE_ONBOARDING_TOKEN_KEY, token);
}
export function getGoogleOnboardingToken() {
  return localStorage.getItem(GOOGLE_ONBOARDING_TOKEN_KEY);
}
export function clearGoogleOnboardingToken() {
  localStorage.removeItem(GOOGLE_ONBOARDING_TOKEN_KEY);
}
export function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}
