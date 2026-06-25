import { API_URL } from "@/config";

export interface LinkPreviewData {
  title: string | null;
  description: string | null;
  image: string | null;
  url: string;
}

interface CacheEntry {
  data: LinkPreviewData;
  expiry: number;
}

const previewCache = new Map<string, CacheEntry>();
const CACHE_TTL = 1000 * 60 * 60;

export async function fetchLinkPreview(url: string): Promise<LinkPreviewData> {
  const cached = previewCache.get(url);
  if (cached && cached.expiry > Date.now()) return cached.data;

  const params = new URLSearchParams({ url });
  const res = await fetch(`${API_URL}/link-previews?${params}`);
  if (!res.ok) {
    return { title: null, description: null, image: null, url };
  }
  const data = (await res.json()) as LinkPreviewData;
  previewCache.set(url, { data, expiry: Date.now() + CACHE_TTL });
  return data;
}
