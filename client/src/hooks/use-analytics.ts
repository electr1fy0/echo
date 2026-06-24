import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router";
import { track, trackPageView } from "@/lib/analytics";
import { fetchUserAnalytics, fetchPostAnalytics } from "@/api/analytics";
import { useAuth } from "@/hooks/use-auth";

export function useAnalytics() {
  const { data: user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;
    trackPageView();
  }, [location.pathname, user]);
}

export function useAutoTrack(eventName: string, enabled?: boolean) {
  useEffect(() => {
    if (enabled ?? true) {
      track(eventName);
    }
  }, [eventName, enabled]);
}

export function useUserAnalytics() {
  const { data: user } = useAuth();
  return useQuery({
    queryKey: ["analytics", "me"],
    queryFn: fetchUserAnalytics,
    enabled: !!user,
    staleTime: 60_000,
    refetchInterval: 60_000,
  });
}

export function usePostAnalytics(postUid: string | undefined) {
  return useQuery({
    queryKey: ["analytics", "post", postUid],
    queryFn: () => fetchPostAnalytics(postUid!),
    enabled: !!postUid,
    staleTime: 30_000,
  });
}
