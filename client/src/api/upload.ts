import { API_URL } from "@/config";
import { getAuthHeaders } from "@/lib/utils";

export async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_URL}/upload`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
    body: form,
  });
  if (!res.ok) throw new Error("upload failed");
  const { url } = await res.json();
  return url;
}

export async function uploadImagePresigned(file: File): Promise<string> {
  const presignRes = await fetch(`${API_URL}/upload/presign`, {
    method: "POST",
    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, contentType: file.type }),
  });
  if (!presignRes.ok) throw new Error("failed to get presigned URL");
  const { url: presignedUrl, publicUrl } = await presignRes.json();

  try {
    const uploadRes = await fetch(presignedUrl, { method: "PUT", body: file });
    if (!uploadRes.ok) throw new Error("upload to R2 failed");
    return publicUrl;
  } catch {
    // Presigned URL failed (likely CORS), fall back to proxy upload
    return uploadImage(file);
  }
}
