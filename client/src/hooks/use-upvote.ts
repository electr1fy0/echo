import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateVotes } from "@/api/questions";
import { updateReplyVotes } from "@/api/replies";
import { track } from "@/lib/analytics";
import type { QuestionItem, AnswerItem } from "@/types";

export const REPLY_UPVOTE_MUTATION_KEY = ["reply-upvote"];

export function toggleQuestionItem(item: QuestionItem): QuestionItem {
  return {
    ...item,
    question: {
      ...item.question,
      isUpvoted: !item.question.isUpvoted,
      upvotes: item.question.isUpvoted
        ? Math.max(0, item.question.upvotes - 1)
        : item.question.upvotes + 1,
    },
  };
}

export function toggleReplyItem(item: AnswerItem): AnswerItem {
  const isUpvoted = !item.answer.isUpvoted;
  return {
    ...item,
    answer: {
      ...item.answer,
      isUpvoted,
      upvotes: isUpvoted
        ? item.answer.upvotes + 1
        : Math.max(0, item.answer.upvotes - 1),
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

      const updater = makeUpdater(qid);
      queryClient.setQueriesData({ queryKey: ["questions"] }, updater);
      queryClient.setQueriesData({ queryKey: ["user-questions"] }, updater);
      queryClient.setQueriesData({ queryKey: ["search-questions"] }, updater);
      queryClient.setQueryData(["question", qid], (old: QuestionItem | undefined) =>
        old ? toggleQuestionItem(old) : old,
      );
    },
    onError: (_err, qid) => {
      const rollback = makeUpdater(qid);
      queryClient.setQueriesData({ queryKey: ["questions"] }, rollback);
      queryClient.setQueriesData({ queryKey: ["user-questions"] }, rollback);
      queryClient.setQueriesData({ queryKey: ["search-questions"] }, rollback);
      queryClient.setQueryData(["question", qid], (old: QuestionItem | undefined) =>
        old ? toggleQuestionItem(old) : old,
      );
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
      queryClient.setQueryData<AnswerItem[]>(["replies", key], (old) => {
        if (!old) return undefined;
        return old.map((item) =>
          item.answer.uid === rid ? toggleReplyItem(item) : item,
        );
      });
      return { queryKey: key };
    },
    onError: (_err, { rid }, context) => {
      if (!context?.queryKey) return;
      queryClient.setQueryData<AnswerItem[]>(["replies", context.queryKey], (old) => {
        if (!old) return undefined;
        return old.map((item) =>
          item.answer.uid === rid ? toggleReplyItem(item) : item,
        );
      });
    },
    onSettled: (_data, err, vars) => {
      if (!err) {
        track("reply_upvote");
      }
      queryClient.invalidateQueries({ queryKey: ["replies", vars.queryKey ?? vars.qid] });
    },
  });
}
