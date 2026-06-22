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
        queryClient.cancelQueries({ queryKey: ["question", qid] }),
      ]);
      const questionsCache = queryClient.getQueryCache();
      const matchingQueries = questionsCache.findAll({
        predicate: (query) => {
          const key = query.queryKey;
          return (
            key[0] === "questions" ||
            key[0] === "user-questions" ||
            key[0] === "search-questions" ||
            (key[0] === "question" && key[1] === qid)
          );
        },
      });
      const previousData = matchingQueries.map((query) => ({
        queryKey: query.queryKey,
        data: query.state.data,
      }));

      matchingQueries.forEach((query) => {
        const data = query.state.data;
        if (!data) return;

        // 1. Singular question query
        if (query.queryKey[0] === "question" && query.queryKey[1] === qid) {
          const item = data as QuestionItem;
          const isUpvoted = !item.question.isUpvoted;
          queryClient.setQueryData(query.queryKey, {
            ...item,
            question: {
              ...item.question,
              isUpvoted,
              upvotes: isUpvoted ? item.question.upvotes + 1 : item.question.upvotes - 1,
            },
          });
          return;
        }

        // 2. Infinite query caches
        if (typeof data === "object" && data !== null && "pages" in data) {
          const infiniteData = data as { pages: QuestionItem[][]; pageParams: any[] };
          const updatedPages = infiniteData.pages.map((page) =>
            page.map((item) => {
              if (item.question.uid === qid) {
                const isUpvoted = !item.question.isUpvoted;
                return {
                  ...item,
                  question: {
                    ...item.question,
                    isUpvoted,
                    upvotes: isUpvoted ? item.question.upvotes + 1 : item.question.upvotes - 1,
                  },
                };
              }
              return item;
            })
          );
          queryClient.setQueryData(query.queryKey, {
            ...infiniteData,
            pages: updatedPages,
          });
        } 
        // 3. Regular flat array caches (search / user lists)
        else if (Array.isArray(data)) {
          const updatedData = data.map((item) => {
            if (item.question.uid === qid) {
              const isUpvoted = !item.question.isUpvoted;
              return {
                ...item,
                question: {
                  ...item.question,
                  isUpvoted,
                  upvotes: isUpvoted ? item.question.upvotes + 1 : item.question.upvotes - 1,
                },
              };
            }
            return item;
          });
          queryClient.setQueryData(query.queryKey, updatedData);
        }
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
    onSettled: (_data, _err, qid) => {
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
