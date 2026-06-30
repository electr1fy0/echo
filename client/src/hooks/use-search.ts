import { globalSearch } from "@/api/search";
import type { SearchResponse } from "@/types";
import { useQuery } from "@tanstack/react-query";

const normalizeSearchResponse = (
  data?: SearchResponse | null,
): SearchResponse => ({
  chambers: data?.chambers ?? [],
  questions: data?.questions ?? [],
  replies: data?.replies ?? [],
  users: data?.users ?? [],
});

export function useGlobalSearch(query: string) {
  const { data, ...rest } = useQuery({
    queryKey: ["search", query],
    queryFn: () => globalSearch(query),
    enabled: query.length > 0,
    staleTime: 1000 * 60 * 2,
  });
  return { ...rest, data: normalizeSearchResponse(data) };
}
