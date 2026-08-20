import { useState } from "react";
import { useNavigate } from "react-router";
import type { QuestionDraft, QuestionItem } from "@/types";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { track } from "@/lib/analytics";
import { applyOptimisticPollVote } from "@/lib/optimistic-poll";
import {
  fetchQuestion,
  fetchQuestions,
  createQuestion,
  deleteQuestion,
  updateQuestion,
  fetchUserQuestions,
  searchQuestions,
  pinQuestion,
  unpinQuestion,
  expressInterestViaDM,
  applyToPartner,
  fetchPartnerApplications,
  updatePartnerApplicationStatus,
  votePoll,
} from "@/api/questions";

export function useQuestionQuery(questionId: string | undefined) {
  return useQuery({
    queryKey: ["question", questionId],
    queryFn: () => fetchQuestion(questionId!),
    enabled: !!questionId,
    staleTime: 60_000,
  });
}

export function useQuestionsQuery(
  sort?: "votes" | "time_created" | "hot",
  filter?: "joined" | "following",
  chamberId?: string,
  author?: string,
  postType?: string
) {
  return useQuery({
    queryKey: ["questions", sort, filter, chamberId, author, postType],
    queryFn: () => fetchQuestions(sort, filter, chamberId, author, undefined, undefined, postType),
    staleTime: 60_000,
  });
}

export function useInfiniteQuestionsQuery(
  sort?: "votes" | "time_created" | "hot",
  filter?: "joined" | "following",
  chamberId?: string,
  author?: string,
  pageSize = 20,
  postType?: string,
  pinned?: boolean,
  searchQuery?: string,
  channelUid?: string,
  channelName?: string,
  enabled?: boolean,
) {
  return useInfiniteQuery({
    queryKey: ["questions", "infinite", sort, filter, chamberId, author, pageSize, postType, pinned, searchQuery, channelUid, channelName],
    queryFn: ({ pageParam = 0 }) =>
      fetchQuestions(sort, filter, chamberId, author, pageSize, pageParam as number, postType, pinned, searchQuery, channelUid, channelName),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < pageSize) return undefined;
      return allPages.length * pageSize;
    },
    staleTime: 60_000,
    enabled,
  });
}

export function usePinnedQuestionsQuery(chamberId: string | undefined, postType?: string, channelUid?: string, channelName?: string) {
  return useQuery({
    queryKey: ["questions", "pinned", chamberId, postType, channelUid, channelName],
    queryFn: () => fetchQuestions("time_created", undefined, chamberId, undefined, 10, 0, postType, true, undefined, channelUid, channelName),
    enabled: !!chamberId,
    staleTime: 60_000,
  });
}

export function useUserQuestionsQuery() {
  return useQuery({
    queryKey: ["user-questions"],
    queryFn: () => fetchUserQuestions(),
    staleTime: 60_000,
  });
}

export function useInfiniteUserQuestionsQuery(pageSize = 20) {
  return useInfiniteQuery({
    queryKey: ["user-questions", "infinite", pageSize],
    queryFn: ({ pageParam = 0 }) =>
      fetchUserQuestions(pageSize, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < pageSize) return undefined;
      return allPages.length * pageSize;
    },
    staleTime: 60_000,
  });
}

export function useTrendingQuestions() {
  return useQuery({
    queryKey: ["questions", "votes"],
    queryFn: () => fetchQuestions("votes"),
    staleTime: 120_000,
  });
}

export function useCreateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createQuestion,
    onSuccess: () => {
      track("post_create");
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
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["questions"] }),
        queryClient.cancelQueries({ queryKey: ["user-questions"] }),
      ]);

      const previousQuestions = queryClient.getQueriesData({ queryKey: ["questions"] });
      const previousUserQuestions = queryClient.getQueriesData({ queryKey: ["user-questions"] });

      const removeItem = (old: unknown) => {
        if (!old) return old;
        if (typeof old === "object" && "pages" in old) {
          const inf = old as { pages: QuestionItem[][]; pageParams: unknown[] };
          return {
            ...inf,
            pages: inf.pages.map((page) =>
              page.filter((item) => item.question.uid !== questionId),
            ),
          };
        }
        if (Array.isArray(old)) {
          return old.filter((item: QuestionItem) => item.question.uid !== questionId);
        }
        return old;
      };

      queryClient.setQueriesData({ queryKey: ["questions"] }, removeItem);
      queryClient.setQueriesData({ queryKey: ["user-questions"] }, removeItem);

      return { previousQuestions, previousUserQuestions };
    },
    onError: (_err, _questionId, context) => {
      if (!context) return;
      for (const [key, data] of context.previousQuestions ?? []) {
        if (data !== undefined) queryClient.setQueryData(key, data);
      }
      for (const [key, data] of context.previousUserQuestions ?? []) {
        if (data !== undefined) queryClient.setQueryData(key, data);
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
    mutationFn: ({
      questionId,
      ...payload
    }: {
      questionId: string;
      content?: string;
      customFields?: Record<string, any>;
      tradePrice?: number;
      tradeCondition?: string;
      tradeBookIsbn?: string;
      tradeStatus?: string;
      partnerSlotsNeeded?: number;
      partnerStatus?: string;
      partnerTargetGrade?: string;
      partnerWorkstyle?: string;
      taxiDeparture?: string;
      taxiDestination?: string;
      taxiDatetime?: string;
      taxiSeatsAvailable?: number;
      taxiStatus?: string;
    }) => updateQuestion(questionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["user-questions"] });
    },
  });
}

export function usePinQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => pinQuestion(questionId),
    onSuccess: (_data, questionId) => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["user-questions"] });
      queryClient.invalidateQueries({ queryKey: ["search-questions"] });
      queryClient.invalidateQueries({ queryKey: ["question", questionId] });
    },
  });
}

export function useUnpinQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) => unpinQuestion(questionId),
    onSuccess: (_data, questionId) => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      queryClient.invalidateQueries({ queryKey: ["user-questions"] });
      queryClient.invalidateQueries({ queryKey: ["search-questions"] });
      queryClient.invalidateQueries({ queryKey: ["question", questionId] });
    },
  });
}

export function useSearchQuestions(query: string) {
  return useQuery({
    queryKey: ["search-questions", query],
    queryFn: () => searchQuestions(query),
    enabled: query.length > 0,
    staleTime: 60_000,
  });
}

export function useExpressInterestViaDM() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ authorUsername, templateMessage }: { authorUsername: string; templateMessage: string }) =>
      expressInterestViaDM(authorUsername, templateMessage),
    onSuccess: (conv) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      navigate(`/dm/${conv.uid}`);
    },
  });
}

export function useApplyToPartner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, pitch }: { questionId: string; pitch: string }) =>
      applyToPartner(questionId, pitch),
    onSuccess: (_data, { questionId }) => {
      queryClient.invalidateQueries({ queryKey: ["partner-applications", questionId] });
    },
  });
}

export function usePartnerApplicationsQuery(questionId: string | undefined) {
  return useQuery({
    queryKey: ["partner-applications", questionId],
    queryFn: () => fetchPartnerApplications(questionId!),
    enabled: !!questionId,
    staleTime: 30_000,
  });
}

export function useUpdatePartnerApplicationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      questionId,
      appUid,
      status,
    }: {
      questionId: string;
      appUid: string;
      status: "accepted" | "declined";
    }) => updatePartnerApplicationStatus(questionId, appUid, status),
    onSuccess: (_data, { questionId }) => {
      queryClient.invalidateQueries({ queryKey: ["partner-applications", questionId] });
    },
  });
}

export function useVotePoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, optionIndex }: { questionId: string; optionIndex: number }) =>
      votePoll(questionId, optionIndex),
    onMutate: async ({ questionId, optionIndex }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["question", questionId] }),
        queryClient.cancelQueries({ queryKey: ["questions"] }),
      ]);

      const previousQuestions = queryClient.getQueriesData({ queryKey: ["questions"] });
      const previousQuestion = queryClient.getQueryData<QuestionItem>(["question", questionId]);

      const applyVote = (old: unknown) => {
        if (!old) return old;
        if (typeof old === "object" && "pages" in old) {
          const inf = old as { pages: QuestionItem[][]; pageParams: unknown[] };
          return {
            ...inf,
            pages: inf.pages.map((page) =>
              page.map((item) =>
                item.question.uid === questionId
                  ? applyOptimisticPollVote(item, optionIndex)
                  : item,
              ),
            ),
          };
        }
        if (Array.isArray(old)) {
          return old.map((item: QuestionItem) =>
            item.question.uid === questionId
              ? applyOptimisticPollVote(item, optionIndex)
              : item,
          );
        }
        return old;
      };

      queryClient.setQueriesData({ queryKey: ["questions"] }, applyVote);
      queryClient.setQueryData(["question", questionId], (old: QuestionItem | undefined) =>
        old ? applyOptimisticPollVote(old, optionIndex) : old,
      );

      return { previousQuestions, previousQuestion };
    },
    onError: (_err, _vars, context) => {
      if (!context) return;
      for (const [key, data] of context.previousQuestions ?? []) {
        if (data !== undefined) queryClient.setQueryData(key, data);
      }
      if (context.previousQuestion !== undefined) {
        queryClient.setQueryData(["question", _vars.questionId], context.previousQuestion);
      }
    },
    onSettled: (_data, _err, { questionId }) => {
      queryClient.invalidateQueries({ queryKey: ["question", questionId] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}
