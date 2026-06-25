import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchConversations,
  createConversation,
  fetchMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  markConversationRead,
  getUnreadMessageCount,
} from "@/api/dms";
import { useToken } from "@/hooks/use-auth";

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

export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationUid: string) => markConversationRead(conversationUid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["messages", "unread-count"] });
    },
  });
}

export function useEditMessage(conversationUid: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageUid, content }: { messageUid: string; content: string }) =>
      editMessage(conversationUid!, messageUid, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationUid] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useDeleteMessage(conversationUid: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageUid: string) => deleteMessage(conversationUid!, messageUid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationUid] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useUnreadMessageCount() {
  const token = useToken();
  return useQuery({
    queryKey: ["messages", "unread-count"],
    queryFn: getUnreadMessageCount,
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: false,
    enabled: !!token,
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
