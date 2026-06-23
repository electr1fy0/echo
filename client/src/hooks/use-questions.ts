import { useState } from "react";
import { useNavigate } from "react-router";
import type { QuestionDraft, QuestionItem } from "@/types";
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
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
  expressInterest,
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
    staleTime: 30_000,
  });
}

export function useQuestionsQuery(
  sort?: "votes" | "time_created" | "hot",
  filter?: "joined",
  chamberId?: string,
  author?: string,
  postType?: string
) {
  return useQuery({
    queryKey: ["questions", sort, filter, chamberId, author, postType],
    queryFn: () => fetchQuestions(sort, filter, chamberId, author, undefined, undefined, postType),
    staleTime: 30_000,
  });
}

export function useInfiniteQuestionsQuery(
  sort?: "votes" | "time_created" | "hot",
  filter?: "joined",
  chamberId?: string,
  author?: string,
  pageSize = 20,
  postType?: string,
  pinned?: boolean,
  searchQuery?: string,
  channelUid?: string
) {
  return useInfiniteQuery({
    queryKey: ["questions", "infinite", sort, filter, chamberId, author, pageSize, postType, pinned, searchQuery, channelUid],
    queryFn: ({ pageParam = 0 }) =>
      fetchQuestions(sort, filter, chamberId, author, pageSize, pageParam as number, postType, pinned, searchQuery, channelUid),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < pageSize) return undefined;
      return allPages.length * pageSize;
    },
    staleTime: 30_000,
  });
}

export function usePinnedQuestionsQuery(chamberId: string | undefined, postType?: string, channelUid?: string) {
  return useQuery({
    queryKey: ["questions", "pinned", chamberId, postType, channelUid],
    queryFn: () => fetchQuestions("time_created", undefined, chamberId, undefined, 10, 0, postType, true, undefined, channelUid),
    enabled: !!chamberId,
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
        data: query.state.data,
      }));

      matchingQueries.forEach((query) => {
        const data = query.state.data;
        if (!data) return;
        if (typeof data === "object" && data !== null && "pages" in data) {
          const infiniteData = data as { pages: QuestionItem[][]; pageParams: any[] };
          const updatedPages = infiniteData.pages.map((page) =>
            page.filter((item) => item.question.uid !== questionId)
          );
          queryClient.setQueryData(query.queryKey, {
            ...infiniteData,
            pages: updatedPages,
          });
        } else if (Array.isArray(data)) {
          const filtered = data.filter((item) => item.question.uid !== questionId);
          queryClient.setQueryData(query.queryKey, filtered);
        }
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
    mutationFn: ({
      questionId,
      ...payload
    }: {
      questionId: string;
      content?: string;
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
    staleTime: 30_000,
  });
}

export function useExpressInterest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ questionId, message }: { questionId: string; message?: string }) =>
      expressInterest(questionId, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
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
    staleTime: 10_000,
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
    onSuccess: (_data, { questionId }) => {
      queryClient.invalidateQueries({ queryKey: ["question", questionId] });
      queryClient.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}
