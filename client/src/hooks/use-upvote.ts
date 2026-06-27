import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateVotes } from "@/api/questions";
import { updateReplyVotes } from "@/api/replies";
import { track } from "@/lib/analytics";
import type { QuestionItem, AnswerItem } from "@/types";

export const REPLY_UPVOTE_MUTATION_KEY = ["reply-upvote"];

function toggleQuestionItem(item: QuestionItem): QuestionItem {
  return {
    ...item,
    question: {
      ...item.question,
      isUpvoted: !item.question.isUpvoted,
      upvotes: item.question.isUpvoted ? item.question.upvotes - 1 : item.question.upvotes + 1,
    },
  };
}

function makeUpdater(qid: string) {
  return (old: unknown) => {
    if (!old) return old;
    if (typeof old === "object" && "pages" in old) {
      const inf = old as { pages: QuestionItem[][]; pageParams: unknown[] };
      return {
        ...inf,
        pages: inf.pages.map((page) =>
          page.map((item) => (item.question.uid === qid ? toggleQuestionItem(item) : item)),
        ),
      };
    }
    if (Array.isArray(old)) {
      return old.map((item: QuestionItem) =>
        item.question.uid === qid ? toggleQuestionItem(item) : item,
      );
    }
    return old;
  };
}

export function useUpdateVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (qid: string) => updateVotes(qid),
    onMutate: async (qid) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["questions"] }),
        queryClient.cancelQueries({ queryKey: ["user-questions"] }),
        queryClient.cancelQueries({ queryKey: ["search-questions"] }),
        queryClient.cancelQueries({ queryKey: ["question", qid] }),
      ]);

      const previousQuestions = queryClient.getQueriesData({ queryKey: ["questions"] });
      const previousUserQuestions = queryClient.getQueriesData({ queryKey: ["user-questions"] });
      const previousSearchQuestions = queryClient.getQueriesData({ queryKey: ["search-questions"] });
      const previousQuestion = queryClient.getQueryData<QuestionItem>(["question", qid]);

      const updater = makeUpdater(qid);
      queryClient.setQueriesData({ queryKey: ["questions"] }, updater);
      queryClient.setQueriesData({ queryKey: ["user-questions"] }, updater);
      queryClient.setQueriesData({ queryKey: ["search-questions"] }, updater);
      queryClient.setQueryData(["question", qid], (old: QuestionItem | undefined) =>
        old ? toggleQuestionItem(old) : old,
      );

      return { previousQuestions, previousUserQuestions, previousSearchQuestions, previousQuestion };
    },
    onError: (_err, qid, context) => {
      if (!context) return;
      for (const [key, data] of context.previousQuestions ?? []) {
        if (data !== undefined) queryClient.setQueryData(key, data);
      }
      for (const [key, data] of context.previousUserQuestions ?? []) {
        if (data !== undefined) queryClient.setQueryData(key, data);
      }
      for (const [key, data] of context.previousSearchQuestions ?? []) {
        if (data !== undefined) queryClient.setQueryData(key, data);
      }
      if (context.previousQuestion !== undefined) {
        queryClient.setQueryData(["question", qid], context.previousQuestion);
      }
    },
    onSettled: (_data, err, qid) => {
      if (!err) {
        track("post_upvote");
      }
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["user-questions"] });
      queryClient.invalidateQueries({ queryKey: ["search-questions"] });
      queryClient.invalidateQueries({ queryKey: ["question", qid] });
    },
  });
}

export function useReplyUpdateVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: REPLY_UPVOTE_MUTATION_KEY,
    mutationFn: ({ qid, rid }: { qid: string; rid: string; queryKey?: string }) =>
      updateReplyVotes(qid, rid),
    onMutate: async ({ qid, rid, queryKey }: { qid: string; rid: string; queryKey?: string }) => {
      const key = queryKey ?? qid;
      await queryClient.cancelQueries({ queryKey: ["replies", key] });
      const previousReplies = queryClient.getQueryData<AnswerItem[]>([
        "replies",
        key,
      ]);
      queryClient.setQueryData<AnswerItem[]>(["replies", key], (old) => {
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
      return { previousReplies, queryKey: key };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousReplies) {
        queryClient.setQueryData(
          ["replies", context.queryKey],
          context.previousReplies,
        );
      }
    },
    onSettled: (_data, err, vars) => {
      if (!err) {
        track("reply_upvote");
      }
      queryClient.invalidateQueries({ queryKey: ["replies", vars.queryKey ?? vars.qid] });
    },
  });
}
