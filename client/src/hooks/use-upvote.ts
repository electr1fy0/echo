import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateVotes } from "@/api/questions";
import { updateReplyVotes } from "@/api/replies";
import { QuestionItem, AnswerItem } from "@/types";
export function useUpdateVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (qid: string) => updateVotes(qid),
    onMutate: async (qid) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["questions"] }),
        queryClient.cancelQueries({ queryKey: ["user-questions"] }),
        queryClient.cancelQueries({ queryKey: ["search-questions"] }),
      ]);
      const previousQuestions = queryClient.getQueriesData<QuestionItem[]>(
        { queryKey: ["questions"] },
      );
      const previousUserQuestions = queryClient.getQueriesData<QuestionItem[]>(
        { queryKey: ["user-questions"] },
      );
      const previousSearchQuestions = queryClient.getQueriesData<QuestionItem[]>(
        { queryKey: ["search-questions"] },
      );
      const updateList = (old: QuestionItem[] | undefined) => {
        if (!old) return [];
        return old.map((item) => {
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
      };
      queryClient.setQueriesData({ queryKey: ["questions"] }, updateList);
      queryClient.setQueriesData({ queryKey: ["user-questions"] }, updateList);
      queryClient.setQueriesData({ queryKey: ["search-questions"] }, updateList);
      return {
        previousQuestions,
        previousUserQuestions,
        previousSearchQuestions,
      };
    },
    onError: (_err, _newTodo, context) => {
      if (context?.previousQuestions) {
        context.previousQuestions.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      if (context?.previousUserQuestions) {
        context.previousUserQuestions.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
        });
      }
      if (context?.previousSearchQuestions) {
        context.previousSearchQuestions.forEach(([key, data]) => {
          queryClient.setQueryData(key, data);
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
        if (!old) return [];
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
