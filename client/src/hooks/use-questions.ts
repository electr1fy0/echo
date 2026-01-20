import { useState } from "react";
import type { QuestionDraft, QuestionItem, User, Chamber } from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchQuestions,
  createQuestion,
  deleteQuestion,
  updateQuestion,
  fetchUserQuestions,
  searchQuestions,
} from "@/api/questions";

export function useQuestionsQuery(
  sort?: "votes" | "time_created",
  filter?: "joined",
  chamberId?: string,
  author?: string
) {
  return useQuery({
    queryKey: ["questions", sort, filter, chamberId, author],
    queryFn: () => fetchQuestions(sort, filter, chamberId, author),
    staleTime: 30_000,
  });
}

export function useUserQuestionsQuery() {
  return useQuery({
    queryKey: ["user-questions"],
    queryFn: () => fetchUserQuestions(),
    staleTime: 30_000,
  });
}

export function useTrendingQuestions() {
  return useQuery({
    queryKey: ["questions", "votes"],
    queryFn: () => fetchQuestions("votes"),
    staleTime: 60_000,
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["user-questions"] });
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => deleteQuestion(questionId),
    onMutate: async (questionId) => {
      await queryClient.cancelQueries({ queryKey: ["questions"] });
      await queryClient.cancelQueries({ queryKey: ["user-questions"] });

      const questionsCache = queryClient.getQueryCache();
      const matchingQueries = questionsCache.findAll({
        predicate: (query) => {
          const key = query.queryKey;
          return key[0] === "questions" || key[0] === "user-questions";
        },
      });

      const previousData = matchingQueries.map((query) => ({
        queryKey: query.queryKey,
        data: query.state.data as QuestionItem[] | undefined,
      }));

      matchingQueries.forEach((query) => {
        const data = query.state.data as QuestionItem[] | undefined;
        if (!data) return;
        const filtered = data.filter((item) => item.question.uid !== questionId);
        queryClient.setQueryData(query.queryKey, filtered);
      });

      return { previousData };
    },
    onError: (_err, _questionId, context) => {
      if (context?.previousData) {
        context.previousData.forEach(({ queryKey, data }) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["user-questions"] });
    },
  });
}

const EMPTY_DRAFT: QuestionDraft = { content: "" };

export function useQuestionDraft() {
  const [draft, setDraft] = useState<QuestionDraft>(EMPTY_DRAFT);
  const updateDraft = (fields: Partial<QuestionDraft>) => {
    setDraft((prev) => ({ ...prev, ...fields }));
  };
  const resetDraft = () => setDraft(EMPTY_DRAFT);
  return { draft, updateDraft, resetDraft };
}

export function useUpdateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, content }: { questionId: string; content: string }) =>
      updateQuestion(questionId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["user-questions"] });
    },
  });
}

export function useSearchQuestions(query: string) {
  return useQuery({
    queryKey: ["search-questions", query],
    queryFn: () => searchQuestions(query),
    enabled: query.length > 0,
    staleTime: 30_000,
  });
}
