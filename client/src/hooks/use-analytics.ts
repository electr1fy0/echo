import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router";
import { track, trackPageView } from "@/lib/analytics";
import { fetchUserAnalytics, fetchPostAnalytics, sendHeartbeat } from "@/api/analytics";
import { useAuth } from "@/hooks/use-auth";

export function useAnalytics() {
  const { data: user } = useAuth();
  const location = useLocation();
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user) return;
    trackPageView();
    sendHeartbeat(location.pathname);

    const interval = setInterval(() => {
      sendHeartbeat(location.pathname);
    }, 60000);

    heartbeatRef.current = interval;

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
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
    staleTime: 120_000,
    refetchInterval: 120_000,
  });
}

export function usePostAnalytics(postUid: string | undefined) {
  return useQuery({
    queryKey: ["analytics", "post", postUid],
    queryFn: () => fetchPostAnalytics(postUid!),
    enabled: !!postUid,
    staleTime: 60_000,
  });
}
