import { useState } from "react";
import type { QuestionDraft } from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchQuestions,
  createQuestion,
  deleteQuestion,
  fetchUserQuestions,
  searchQuestions,
} from "@/api/questions";

export function useQuestionsQuery(offset = 0, limit = 10) {
  return useQuery({
    queryKey: ["questions", offset, limit],
    queryFn: () => fetchQuestions(offset, limit),
    staleTime: 30_000,
  });
}

export function useUserQuestionsQuery(offset = 0, limit = 10) {
  return useQuery({
    queryKey: ["user-questions", "question", offset, limit],
    queryFn: () => fetchUserQuestions(offset, limit),
    staleTime: 30_000,
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

    onSuccess: () => {
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

export function useSearchQuestions(query: string, offset = 0, limit = 20) {
  return useQuery({
    queryKey: ["search-questions", query, offset, limit],
    queryFn: () => searchQuestions(query, offset, limit),
    enabled: query.length > 0,
    staleTime: 30_000,
  });
}
