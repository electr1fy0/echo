import { useState } from "react";
import type { Question } from "@/types";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchQuestions, createQuestion } from "@/api/questions";

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

export function useQuestionDraft() {
  const [question, setQuestion] = useState<Question>({ content: "" });

  const updateQuestion = (fields: Partial<Question>) => {
    setQuestion((prev) => ({ ...prev, ...fields }));
  };

  return { question, updateQuestion, setQuestion };
}
