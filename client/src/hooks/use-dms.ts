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
import { useAuth, useToken } from "@/hooks/use-auth";
import type { Conversation, Message } from "@/types";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
    refetchInterval: 6_000,
    staleTime: 3_000,
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
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ["messages", conversationUid],
    queryFn: async () => {
      const existing = queryClient.getQueryData<Message[]>(["messages", conversationUid]);
      const lastNonOptimistic = existing?.reduce<Message | undefined>((latest, m) => {
        if (!m.uid.startsWith("optimistic-") && (!latest || new Date(m.timeCreated) > new Date(latest.timeCreated))) return m;
        return latest;
      }, undefined);
      const since = lastNonOptimistic?.timeCreated;
      const fresh = await fetchMessages(conversationUid!, 50, 0, since);
      if (!existing) return fresh;

      const seen = new Map<string, Message>();
      for (const m of existing) {
        seen.set(m.uid, m);
      }
      for (const m of fresh) {
        seen.set(m.uid, m);
      }

      return Array.from(seen.values()).sort(
        (a, b) => new Date(a.timeCreated).getTime() - new Date(b.timeCreated).getTime(),
      );
    },
    enabled: !!conversationUid,
    refetchInterval: 3_000,
    staleTime: 1_500,
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
    onMutate: async ({ messageUid, content }) => {
      await queryClient.cancelQueries({ queryKey: ["messages", conversationUid] });
      const previousMessages = queryClient.getQueryData<Message[]>(["messages", conversationUid]);
      queryClient.setQueryData<Message[]>(["messages", conversationUid], (old) =>
        old?.map((m) => (m.uid === messageUid ? { ...m, content } : m)),
      );
      return { previousMessages };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(["messages", conversationUid], context.previousMessages);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationUid] });
    },
  });
}

export function useDeleteMessage(conversationUid: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageUid: string) => deleteMessage(conversationUid!, messageUid),
    onMutate: async (messageUid) => {
      await queryClient.cancelQueries({ queryKey: ["messages", conversationUid] });
      const previousMessages = queryClient.getQueryData<Message[]>(["messages", conversationUid]);
      queryClient.setQueryData<Message[]>(["messages", conversationUid], (old) =>
        old?.filter((m) => m.uid !== messageUid),
      );
      return { previousMessages };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(["messages", conversationUid], context.previousMessages);
      }
    },
    onSettled: () => {
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
  const { data: user } = useAuth();
  return useMutation({
    mutationFn: (content: string) => sendMessage(conversationUid!, content),
    onMutate: async (content) => {
      await queryClient.cancelQueries({ queryKey: ["messages", conversationUid] });
      const previousMessages = queryClient.getQueryData<Message[]>(["messages", conversationUid]);
      const optimisticMessage: Message = {
        uid: `optimistic-${crypto.randomUUID()}`,
        conversationUid: conversationUid!,
        sender: user?.username ?? "",
        content,
        timeCreated: new Date().toISOString(),
      };
      queryClient.setQueryData<Message[]>(["messages", conversationUid], (old) =>
        old ? [...old, optimisticMessage] : [optimisticMessage],
      );
      return { previousMessages };
    },
    onSuccess: (newMsg) => {
      queryClient.setQueryData<Message[]>(["messages", conversationUid], (old) => {
        if (!old) return [newMsg];
        const filtered = old.filter((m) => !m.uid.startsWith("optimistic-"));
        if (filtered.some((m) => m.uid === newMsg.uid)) return filtered;
        return [...filtered, newMsg];
      });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (_err, _vars, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(["messages", conversationUid], context.previousMessages);
      }
    },
  });
}
