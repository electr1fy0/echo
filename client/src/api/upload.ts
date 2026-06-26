import { API_URL } from "@/config";
import { getAuthHeaders } from "@/lib/utils";
import { parseApiError } from "@/lib/api-error";
import { compressImage } from "@/lib/compress-image";

async function uploadImageRaw(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
    body: form,
  });
  if (!res.ok) await parseApiError(res);
  const { url } = await res.json();
  return url;
}

async function uploadImagePresignedRaw(file: File): Promise<string> {
  const presignRes = await fetch(`${API_URL}/upload/presign`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, contentType: file.type }),
  });
  if (!presignRes.ok) await parseApiError(presignRes);
  const { url: presignedUrl, publicUrl } = await presignRes.json();

  const uploadRes = await fetch(presignedUrl, { method: "PUT", body: file });
  if (!uploadRes.ok) throw new Error("upload to R2 failed");
  return publicUrl;
}

export async function uploadImage(file: File): Promise<string> {
  return uploadImageRaw(await compressImage(file));
}

export async function uploadImagePresigned(file: File): Promise<string> {
  const compressed = await compressImage(file);
  try {
    return await uploadImagePresignedRaw(compressed);
  } catch {
    return uploadImageRaw(compressed);
  }
}
