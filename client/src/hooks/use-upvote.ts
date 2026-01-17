// import type { UpvoteState } from "@/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateVotes } from "@/api/questions";

// type UseUpvoteOptions = {
//   initialCount?: number;
//   initialUpvoted?: boolean;
// };

// type UseUpvoteReturn = UpvoteState & {
//   toggle: () => void;
// };

export function useUpdateVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (qid: string) => updateVotes(qid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["user-questions"] });
      queryClient.invalidateQueries({ queryKey: ["search-questions"] });
    },
  });
}

