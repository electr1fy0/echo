import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchBookmarks,
  bookmarkPost,
  unbookmarkPost,
} from "@/api/bookmarks";

export function useBookmarksQuery(limit?: number, query?: string) {
  return useQuery({
    queryKey: ["bookmarks", limit, query],
    queryFn: () => fetchBookmarks(limit, undefined, query),
    staleTime: 30_000,
  });
}

export function useBookmarkPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postUid: string) => bookmarkPost(postUid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}

export function useUnbookmarkPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postUid: string) => unbookmarkPost(postUid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}
