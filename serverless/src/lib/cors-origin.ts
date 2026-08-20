const DEFAULT_DEV_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

export function getAllowedCorsOrigins(configuredOrigins?: string): Set<string> {
  const allowed = new Set(DEFAULT_DEV_ORIGINS);

  for (const origin of configuredOrigins?.split(",") ?? []) {
    const trimmed = origin.trim();
    if (trimmed) allowed.add(trimmed);
  }

  return allowed;
}

export function resolveCorsOrigin(
  requestOrigin: string,
  configuredOrigins?: string,
): string {
  if (!requestOrigin) return "";
  return getAllowedCorsOrigins(configuredOrigins).has(requestOrigin)
    ? requestOrigin
    : "";
}
