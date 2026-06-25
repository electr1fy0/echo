import { API_URL } from "@/config";

export interface LinkPreviewData {
  title: string | null;
  description: string | null;
  image: string | null;
  url: string;
}

const previewCache = new Map<string, LinkPreviewData>();

export async function fetchLinkPreview(url: string): Promise<LinkPreviewData> {
  const cached = previewCache.get(url);
  if (cached) return cached;

  const params = new URLSearchParams({ url });
  const res = await fetch(`${API_URL}/link-previews?${params}`);
  if (!res.ok) {
    return { title: null, description: null, image: null, url };
  }
  const data = (await res.json()) as LinkPreviewData;
  previewCache.set(url, data);
  return data;
}
