import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listNotifications, getUnreadNotificationCount, markNotificationsRead } from "@/api/notifications";
import { useToken } from "@/hooks/use-auth";

export function useNotificationsQuery() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => listNotifications(),
    staleTime: 60 * 1000,
  });
}

export function useUnreadNotificationCount() {
  const token = useToken();
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: getUnreadNotificationCount,
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: false,
    enabled: !!token,
  });
}

export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });
}

export function useInfiniteNotificationsQuery(pageSize = 20) {
  return useInfiniteQuery({
    queryKey: ["notifications", "infinite", pageSize],
    queryFn: ({ pageParam = 0 }) =>
      listNotifications(pageSize, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < pageSize) return undefined;
      return allPages.length * pageSize;
    },
    staleTime: 60 * 1000,
  });
}
