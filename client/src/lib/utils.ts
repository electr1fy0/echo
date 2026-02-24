import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
const GOOGLE_ONBOARDING_TOKEN_KEY = "google_onboarding_token";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function getToken() {
  return localStorage.getItem("token");
}
export function setToken(token: string) {
  localStorage.setItem("token", token);
}
export function removeToken() {
  localStorage.removeItem("token");
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
