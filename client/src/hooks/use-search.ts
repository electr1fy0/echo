import { globalSearch } from "@/api/search";
import { useQuery } from "@tanstack/react-query";

export function useGlobalSearch(query: string) {
    return useQuery({
        queryKey: ["search", query],
        queryFn: () => globalSearch(query),
        enabled: query.length > 0,
        staleTime: 1000 * 60 * 1,
    });
}
