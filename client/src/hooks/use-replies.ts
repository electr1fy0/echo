import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchReplies,
  createReply,
  deleteReply,
  updateReply,
  acceptReply,
  unacceptReply,
} from "@/api/replies";
import type { AnswerItem } from "@/types";
import { useAuth } from "@/hooks/use-auth";

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
  const { data: user } = useAuth();

  return useMutation({
    mutationFn: ({
      questionId,
      content,
    }: {
      questionId: string;
      content: string;
    }) => createReply(questionId, { content }),
    onMutate: async ({ questionId, content }) => {
      await queryClient.cancelQueries({ queryKey: ["replies", questionId] });

      const previousReplies = queryClient.getQueryData<AnswerItem[]>([
        "replies",
        questionId,
      ]);

      queryClient.setQueryData<AnswerItem[]>(
        ["replies", questionId],
        (old) => {
          if (!user) return old;
          const optimisticReply: AnswerItem = {
            answer: {
              uid: `temp-${Date.now()}`,
              content,
              questionUid: questionId,
              timeCreated: new Date(),
              authorUsername: user.username,
              upvotes: 0,
              isUpvoted: false,
              isAccepted: false,
            },
            author: user,
          };
          return [...(old || []), optimisticReply];
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

export function useUpdateReply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ qid, rid, content }: { qid: string; rid: string; content: string }) =>
      updateReply(qid, rid, content),
    onSuccess: (_, { qid }) => {
      queryClient.invalidateQueries({ queryKey: ["replies", qid] });
    },
  });
}

export function useAcceptReply() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      qid,
      rid,
      accept,
    }: {
      qid: string;
      rid: string;
      accept: boolean;
    }) => (accept ? acceptReply(qid, rid) : unacceptReply(qid, rid)),
    onSuccess: (_data, { qid }) => {
      queryClient.invalidateQueries({ queryKey: ["replies", qid] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["user-questions"] });
      queryClient.invalidateQueries({ queryKey: ["question", qid] });
    },
  });
}
