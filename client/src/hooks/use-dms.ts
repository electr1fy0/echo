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
import type { Conversation, Message } from "@/types";

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
    refetchInterval: 8_000,
    staleTime: 5_000,
  });
}

export function useMarkConversationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationUid: string) => markConversationRead(conversationUid),
    onMutate: async (conversationUid) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ["conversations"] }),
        queryClient.cancelQueries({ queryKey: ["messages", "unread-count"] }),
      ]);

      const previousConversations = queryClient.getQueryData<Conversation[]>(["conversations"]);
      const previousUnreadCount = queryClient.getQueryData<number>(["messages", "unread-count"]);

      queryClient.setQueryData<Conversation[]>(["conversations"], (old) =>
        old?.map((conv) =>
          conv.uid === conversationUid ? { ...conv, unreadCount: 0 } : conv
        )
      );

      if (previousConversations) {
        const conv = previousConversations.find((c) => c.uid === conversationUid);
        const delta = conv?.unreadCount ?? 1;
        if (previousUnreadCount !== undefined) {
          queryClient.setQueryData<number>(["messages", "unread-count"], Math.max(0, previousUnreadCount - delta));
        }
      }

      return { previousConversations, previousUnreadCount };
    },
    onError: (_err, _conversationUid, context) => {
      if (context?.previousConversations) {
        queryClient.setQueryData(["conversations"], context.previousConversations);
      }
      if (context?.previousUnreadCount !== undefined) {
        queryClient.setQueryData(["messages", "unread-count"], context.previousUnreadCount);
      }
    },
    onSettled: () => {
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
    refetchInterval: 60_000,
    staleTime: 30_000,
    retry: false,
    enabled: !!token,
  });
}

export function useSendMessage(conversationUid: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => sendMessage(conversationUid!, content),
    onSuccess: (newMsg) => {
      queryClient.setQueryData<Message[]>(["messages", conversationUid], (old) =>
        old ? [...old, newMsg] : [newMsg],
      );
      queryClient.invalidateQueries({ queryKey: ["messages", conversationUid] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
