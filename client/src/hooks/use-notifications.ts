import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { listNotifications } from "@/api/notifications";
export function useNotificationsQuery() {
    return useQuery({
        queryKey: ["notifications"],
        queryFn: () => listNotifications(),
        staleTime: 60 * 1000,
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
