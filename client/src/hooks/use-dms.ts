import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchConversations,
  createConversation,
  fetchMessages,
  sendMessage,
} from "@/api/dms";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
    refetchInterval: 10_000,
    staleTime: 5_000,
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (username: string) => createConversation(username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useMessages(conversationUid: string | undefined) {
  return useQuery({
    queryKey: ["messages", conversationUid],
    queryFn: () => fetchMessages(conversationUid!),
    enabled: !!conversationUid,
    refetchInterval: 3_000,
    staleTime: 1_000,
  });
}

export function useSendMessage(conversationUid: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => sendMessage(conversationUid!, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationUid] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
