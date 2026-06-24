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

  throw new Error(message);
}
