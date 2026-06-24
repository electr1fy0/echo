import { API_URL } from "@/config";
import { getAuthHeaders } from "@/lib/utils";

interface PendingEvent {
  event: string;
  properties?: Record<string, unknown>;
  page?: string;
}

let eventQueue: PendingEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let currentPage: string = window.location.pathname;

const FLUSH_INTERVAL = 30000;

function getSessionId(): string {
  let sessionId = sessionStorage.getItem("analytics_session_id");
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem("analytics_session_id", sessionId);
  }
  return sessionId;
}

async function flush() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  const batch = eventQueue;
  eventQueue = [];

  if (batch.length === 0) return;

  try {
    await fetch(`${API_URL}/analytics/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ events: batch }),
    });
  } catch {}
}

function enqueue(event: PendingEvent) {
  eventQueue.push(event);

  if (!flushTimer) {
    flushTimer = setTimeout(flush, FLUSH_INTERVAL);
  }
}

export function track(event: string, properties?: Record<string, unknown>) {
  enqueue({
    event,
    properties,
    page: currentPage,
  });
}

export function trackPageView() {
  currentPage = window.location.pathname;
  track("page_view", { url: window.location.href });
}

export function setPage(path: string) {
  currentPage = path;
}

export function flushNow() {
  return flush();
}

export { getSessionId };
