import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchReplies, createReply, deleteReply } from "@/api/replies";

export function useRepliesQuery(questionId: string | undefined) {
  return useQuery({
    queryKey: ["replies", questionId],
    queryFn: () => fetchReplies(questionId!),
    enabled: !!questionId,
    staleTime: 30_000,
  });
}

export function useCreateReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      questionId,
      content,
    }: {
      questionId: string;
      content: string;
    }) => createReply(questionId, { content }),

    onSuccess: (_, { questionId }) => {
      queryClient.invalidateQueries({
        queryKey: ["replies", questionId],
      });
    },
  });
}

export function useDeleteReply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questionId,
      replyId,
    }: {
      questionId: string;
      replyId: string;
    }) => deleteReply(questionId, replyId),

    onSuccess: (_, { questionId }) => {
      queryClient.invalidateQueries({ queryKey: ["replies", questionId] });
    },
  });
}
