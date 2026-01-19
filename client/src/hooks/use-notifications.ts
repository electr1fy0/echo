import { useQuery } from "@tanstack/react-query";
import { listNotifications } from "@/api/notifications";
export function useNotificationsQuery() {
    return useQuery({
        queryKey: ["notifications"],
        queryFn: listNotifications,
        staleTime: 60 * 1000,
    });
}
