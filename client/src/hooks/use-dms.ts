import { useEffect, useRef, useCallback } from "react";
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
import { API_URL } from "@/config";
import type { Conversation } from "@/types";

function wsUrl() {
  return API_URL.replace(/^http/, "ws") + "/ws";
}

type WsHandler = (data: unknown) => void;
let ws: WebSocket | null = null;
let wsHandlers = new Map<string, Set<WsHandler>>();
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
let reconnectDelay = 1000;
let handlerCount = 0;

function connectWs(token: string) {
  if (ws?.readyState === WebSocket.OPEN || ws?.readyState === WebSocket.CONNECTING) return;

  ws = new WebSocket(`${wsUrl()}?token=${token}`);

  ws.onopen = () => {
    reconnectDelay = 1000;
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      const handlers = wsHandlers.get(msg.type);
      if (handlers) {
        for (const handler of handlers) {
          try { handler(msg.data); } catch (e) { console.error("[dm-ws] handler error:", e); }
        }
      }
    } catch { }
  };

  ws.onclose = () => {
    ws = null;
    if (handlerCount === 0) return;
    reconnectTimeout = setTimeout(() => {
      const token = localStorage.getItem("token");
      if (token) connectWs(token);
    }, reconnectDelay);
    reconnectDelay = Math.min(reconnectDelay * 2, 30000);
  };

  ws.onerror = () => {
    ws?.close();
  };
}

function disconnectWs() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  ws?.close();
  ws = null;
  reconnectDelay = 1000;
}

function useWsEvent(type: string, handler: WsHandler) {
  const token = useToken();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!token) return;

    handlerCount++;
    connectWs(token);

    if (!wsHandlers.has(type)) {
      wsHandlers.set(type, new Set());
    }
    wsHandlers.get(type)!.add(handlerRef.current);

    return () => {
      wsHandlers.get(type)?.delete(handlerRef.current);
      if (wsHandlers.get(type)?.size === 0) {
        wsHandlers.delete(type);
      }
      handlerCount--;
      if (handlerCount === 0) {
        disconnectWs();
      }
    };
  }, [type, token]);
}

export function useConversations() {
  const queryClient = useQueryClient();

  useWsEvent("new_message", useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
    queryClient.invalidateQueries({ queryKey: ["messages", "unread-count"] });
  }, [queryClient]));

  return useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
    staleTime: 30_000,
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

  useWsEvent("new_message", useCallback((data) => {
    const ev = data as { conversationUid?: string };
    if (ev.conversationUid === conversationUid) {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationUid] });
    }
  }, [conversationUid, queryClient]));

  return useQuery({
    queryKey: ["messages", conversationUid],
    queryFn: () => fetchMessages(conversationUid!),
    enabled: !!conversationUid,
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
  const queryClient = useQueryClient();

  useWsEvent("new_message", useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["messages", "unread-count"] });
  }, [queryClient]));

  return useQuery({
    queryKey: ["messages", "unread-count"],
    queryFn: getUnreadMessageCount,
    staleTime: 30_000,
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
