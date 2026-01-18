import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateVotes } from "@/api/questions";
import { updateReplyVotes } from "@/api/replies";
import type { QuestionItem, AnswerItem } from "@/types";
export function useUpdateVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ["upvote"],
    mutationFn: (qid: string) => updateVotes(qid),
    onMutate: async (qid) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["questions"] }),
        queryClient.cancelQueries({ queryKey: ["user-questions"] }),
        queryClient.cancelQueries({ queryKey: ["search-questions"] }),
      ]);
      const questionsCache = queryClient.getQueryCache();
      const matchingQueries = questionsCache.findAll({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            key[0] === "questions" ||
            key[0] === "user-questions" ||
            key[0] === "search-questions"
          );
        },
      });
      const previousData = matchingQueries.map((query) => ({
        queryKey: query.queryKey,
        data: query.state.data as QuestionItem[] | undefined,
      }));
      matchingQueries.forEach((query) => {
        const data = query.state.data as QuestionItem[] | undefined;
        if (!data) return;

        const updatedData = data.map((item) => {
          if (item.question.uid === qid) {
            const isUpvoted = !item.question.isUpvoted;
            return {
              ...item,
              question: {
                ...item.question,
                isUpvoted,
                upvotes: isUpvoted
                  ? item.question.upvotes + 1
                  : item.question.upvotes - 1,
              },
            };
          }
          return item;
        });

        queryClient.setQueryData(query.queryKey, updatedData);
      });

      return { previousData };
    },
    onError: (_err, _qid, context) => {
      if (context?.previousData) {
        context.previousData.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
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
    onMutate: async ({ qid, rid }) => {
      await queryClient.cancelQueries({ queryKey: ["replies", qid] });
      const previousReplies = queryClient.getQueryData<AnswerItem[]>([
        "replies",
        qid,
      ]);
      queryClient.setQueryData<AnswerItem[]>(["replies", qid], (old) => {
        if (!old) return undefined;
        return old.map((item) => {
          if (item.answer.uid === rid) {
            const isUpvoted = !item.answer.isUpvoted;
            return {
              ...item,
              answer: {
                ...item.answer,
                isUpvoted,
                upvotes: isUpvoted
                  ? item.answer.upvotes + 1
                  : item.answer.upvotes - 1,
              },
            };
          }
          return item;
        });
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

