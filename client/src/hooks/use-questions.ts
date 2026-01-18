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

export function useQuestionsQuery(
  sort?: "votes" | "time_created",
  filter?: "joined",
  chamberId?: string
) {
  return useQuery({
    queryKey: ["questions", sort, filter, chamberId],
    queryFn: () => fetchQuestions(sort, filter, chamberId),
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

export function useSearchQuestions(query: string) {
  return useQuery({
    queryKey: ["search-questions", query],
    queryFn: () => searchQuestions(query),
    enabled: query.length > 0,
    staleTime: 30_000,
  });
}
