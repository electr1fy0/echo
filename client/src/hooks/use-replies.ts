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
import { track } from "@/lib/analytics";

export function useRepliesQuery(questionId: string | undefined) {
  return useQuery({
    queryKey: ["replies", questionId],
    queryFn: () => fetchReplies(questionId!),
    enabled: !!questionId,
    staleTime: 60_000,
  });
}

export function useCreateReply() {
  const queryClient = useQueryClient();
  const { data: user } = useAuth();

  return useMutation({
    mutationFn: ({
      questionId,
      content,
      parentReplyUid,
      isAnonymous,
    }: {
      questionId: string;
      content: string;
      parentReplyUid?: string;
      isAnonymous?: boolean;
    }) => createReply(questionId, { content, parentReplyUid, isAnonymous }),
    onMutate: async ({ questionId, content, parentReplyUid, isAnonymous }) => {
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
              parentReplyUid,
              timeCreated: new Date(),
              authorUsername: user.username,
              isAnonymous,
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
      track("reply_create");
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
    onMutate: async ({ qid, rid, content }) => {
      await queryClient.cancelQueries({ queryKey: ["replies", qid] });
      const previousReplies = queryClient.getQueryData<AnswerItem[]>([
        "replies",
        qid,
      ]);
      queryClient.setQueryData<AnswerItem[]>(["replies", qid], (old) => {
        if (!old) return undefined;
        return old.map((item) =>
          item.answer.uid === rid
            ? { ...item, answer: { ...item.answer, content } }
            : item,
        );
      });
      return { previousReplies };
    },
    onError: (_err, { qid }, context) => {
      if (context?.previousReplies) {
        queryClient.setQueryData(["replies", qid], context.previousReplies);
      }
    },
    onSettled: (_, __, { qid }) => {
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
    onMutate: async ({ qid, rid, accept }) => {
      await queryClient.cancelQueries({ queryKey: ["replies", qid] });
      const previousReplies = queryClient.getQueryData<AnswerItem[]>([
        "replies",
        qid,
      ]);
      queryClient.setQueryData<AnswerItem[]>(["replies", qid], (old) => {
        if (!old) return undefined;
        return old.map((item) =>
          item.answer.uid === rid
            ? { ...item, answer: { ...item.answer, isAccepted: accept } }
            : accept
              ? { ...item, answer: { ...item.answer, isAccepted: false } }
              : item,
        );
      });
      return { previousReplies };
    },
    onError: (_err, { qid }, context) => {
      if (context?.previousReplies) {
        queryClient.setQueryData(["replies", qid], context.previousReplies);
      }
    },
    onSettled: (_, __, { qid }) => {
      queryClient.invalidateQueries({ queryKey: ["replies", qid] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["user-questions"] });
      queryClient.invalidateQueries({ queryKey: ["question", qid] });
    },
  });
}
