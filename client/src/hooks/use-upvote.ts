import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateVotes } from "@/api/questions";
import { updateReplyVotes } from "@/api/replies";

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

export function useReplyUpdateVote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ qid, rid }: { qid: string; rid: string }) =>
      updateReplyVotes(qid, rid),
    onSuccess: (_, { qid }) => {
      queryClient.invalidateQueries({ queryKey: ["replies", qid] });
    },
  });
}
