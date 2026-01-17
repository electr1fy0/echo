import { useState } from "react";
import type { QuestionDraft } from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchQuestions,
  createQuestion,
  deleteQuestion,
} from "@/api/questions";

export function useQuestionsQuery(offset = 0, limit = 10) {
  return useQuery({
    queryKey: ["questions", offset, limit],
    queryFn: () => fetchQuestions(offset, limit),
    staleTime: 30_000,
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createQuestion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}

export function useDeleteQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (questionId: string) => deleteQuestion(questionId),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
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
