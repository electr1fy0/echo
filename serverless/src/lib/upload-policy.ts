import { ApiError } from "./errors";

export const ALLOWED_UPLOAD_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/avif", "image/gif",
  "application/pdf",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "application/zip", "application/x-zip-compressed", "application/x-tar", "application/x-rar-compressed",
] as const;

export const MAX_UPLOAD_SIZE = 12 * 1024 * 1024;

export function assertAllowedUpload(contentType: string, size: number): void {
  if (!ALLOWED_UPLOAD_TYPES.includes(contentType as (typeof ALLOWED_UPLOAD_TYPES)[number])) {
    throw new ApiError(400, `unsupported content type, allowed: ${ALLOWED_UPLOAD_TYPES.join(", ")}`);
  }
  if (!Number.isFinite(size) || size < 0) {
    throw new ApiError(400, "invalid file size");
  }
  if (size > MAX_UPLOAD_SIZE) {
    throw new ApiError(400, `file too large, max ${MAX_UPLOAD_SIZE / (1024 * 1024)}MB`);
  }
}

export function safeFileExtension(filename: string): string {
  const raw = filename.split(".").pop()?.trim().toLowerCase() ?? "";
  return /^[a-z0-9]{1,10}$/.test(raw) ? raw : "bin";
}
