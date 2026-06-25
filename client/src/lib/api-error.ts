import { toastManager } from "@/components/ui/toast";

export class ApiError extends Error {
  detail?: string;
  status: number;

  constructor(status: number, message: string, detail?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export function handleApiError(err: unknown, fallback: string): void {
  if (err instanceof ApiError && err.detail) {
    toastManager.add({ title: err.message, description: err.detail, type: "error" });
  } else {
    toastManager.add({ title: err instanceof Error ? err.message : fallback, type: "error" });
  }
}

export async function parseApiError(res: Response): Promise<never> {
  if (res.status === 401) {
    const { removeToken } = await import("@/lib/utils");
    removeToken();
  }

  let message = `Request failed (${res.status})`;
  try {
    const body = await res.json();
    if (body?.error) message = body.error;
    else if (body?.message) message = body.message;
  } catch {}

  if (res.status === 429) {
    message = "Too many requests. Please slow down.";
  }

  let error: ApiError;
  if (res.status === 500) {
    error = new ApiError(500, "Something went wrong. Please try again.", message);
  } else {
    error = new ApiError(res.status, message);
  }

  console.error(`[API ${res.status}]`, message);
  throw error;
}
