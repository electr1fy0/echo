import { API_URL } from "@/config";
import { getAuthHeaders } from "@/lib/utils";
import { parseApiError } from "@/lib/api-error";

export interface UserAnalytics {
  activity: { date: string; posts: number; replies: number; upvotesReceived: number }[];
  topPosts: { uid: string; content: string; upvotes: number; views: number }[];
  totals: {
    posts: number;
    replies: number;
    upvotesReceived: number;
    upvotesGiven: number;
    profileViews: number;
  };
  streaks: { currentStreak: number; longestStreak: number };
  engagement: { replyRate: number; avgUpvotesPerPost: number };
  calendar: { date: string; count: number }[];
}

export interface PostAnalytics {
  totalViews: number;
  uniqueViewers: number;
  replyCount: number;
  viewsTrend: { date: string; count: number }[];
}

export async function fetchUserAnalytics(): Promise<UserAnalytics> {
  const res = await fetch(`${API_URL}/analytics/me`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) await parseApiError(res);
  return res.json();
}

export async function fetchPostAnalytics(postUid: string): Promise<PostAnalytics> {
  const res = await fetch(`${API_URL}/analytics/questions/${postUid}`, {
    headers: { ...getAuthHeaders() },
  });
  if (!res.ok) await parseApiError(res);
  return res.json();
}

export async function trackPostView(postUid: string): Promise<void> {
  await fetch(`${API_URL}/analytics/questions/${postUid}/view`, {
    method: "POST",
    headers: { ...getAuthHeaders() },
  });
}
