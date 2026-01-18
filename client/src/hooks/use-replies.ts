import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchReplies, createReply, deleteReply } from "@/api/replies";
import type { AnswerItem } from "@/types";

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
    onMutate: async ({ questionId, replyId }) => {
      await queryClient.cancelQueries({ queryKey: ["replies", questionId] });
      const previousReplies = queryClient.getQueryData<AnswerItem[]>([
        "replies",
        questionId,
      ]);
      queryClient.setQueryData<AnswerItem[]>(
        ["replies", questionId],
        (old) => {
          if (!old) return undefined;
          return old.filter((item) => item.answer.uid !== replyId);
        }
      );
      return { previousReplies };
    },
    onError: (_err, { questionId }, context) => {
      if (context?.previousReplies) {
        queryClient.setQueryData(
          ["replies", questionId],
          context.previousReplies
        );
      }
    },
    onSettled: (_, __, { questionId }) => {
      queryClient.invalidateQueries({ queryKey: ["replies", questionId] });
    },
  });
}
