import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInMinutes, differenceInHours, differenceInDays, differenceInWeeks, differenceInMonths, differenceInYears } from "date-fns";

export function formatTimeAgo(date: string | Date) {
  const d = new Date(date);
  const mins = differenceInMinutes(new Date(), d);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = differenceInHours(new Date(), d);
  if (hours < 24) return `${hours}h`;
  const days = differenceInDays(new Date(), d);
  if (days < 7) return `${days}d`;
  const weeks = differenceInWeeks(new Date(), d);
  if (weeks < 4) return `${weeks}w`;
  const months = differenceInMonths(new Date(), d);
  if (months < 12) return `${months}mo`;
  return `${differenceInYears(new Date(), d)}y`;
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
