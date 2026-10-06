import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { chatApi } from "../api/chatApi";

export const chatKeys = {
  all: (userId: number) => ["chat", userId] as const,
  lists: (userId: number) => ["chat", userId, "conversations"] as const,
  conversations: (userId: number, page: number) => ["chat", userId, "conversations", page] as const,
  messages: (userId: number, id: number) => ["chat", userId, "messages", id] as const,
  unread: (userId: number) => ["chat", userId, "unread"] as const,
};
export function useConversationsQuery(userId: number, page: number) {
  return useQuery({
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryKey: chatKeys.conversations(userId, page),
    queryFn: ({ signal }) => chatApi.listConversations(page, signal),
    enabled: userId > 0,
  });
}
export function useMessagesQuery(userId: number, id: number | null, visible: boolean) {
  const cache = useQueryClient();
  useEffect(() => {
    // Disabling a query alone does not abort an already running request.
    return () => {
      if (visible && id !== null)
        void cache.cancelQueries({ queryKey: chatKeys.messages(userId, id) });
    };
  }, [cache, userId, id, visible]);
  return useQuery({
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryKey: chatKeys.messages(userId, id ?? -1),
    queryFn: async ({ signal }) => {
      const detail = await chatApi.getConversation(id ?? -1, signal);
      // GET itself marks read; refresh counts even if the explicit read mutation fails.
      if (!signal.aborted) {
        void cache.invalidateQueries({ queryKey: chatKeys.lists(userId) });
        void cache.invalidateQueries({ queryKey: chatKeys.unread(userId) });
      }
      return detail;
    },
    retry: false,
    enabled: userId > 0 && id !== null && visible,
  });
}
export function useUnreadCountQuery(userId: number) {
  return useQuery({
    staleTime: 0,
    refetchOnWindowFocus: true,
    queryKey: chatKeys.unread(userId),
    queryFn: ({ signal }) => chatApi.getUnreadCount(signal),
    enabled: userId > 0,
  });
}
