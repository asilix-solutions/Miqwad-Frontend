/**
 * @file useChatHistory.ts
 *
 * TanStack Query hooks for chat history: the REST-hydrated conversation
 * list (`GET /api/Conversations`) and a single conversation's message
 * history (`GET /api/Conversations/{conversationId}`, ascending). Silent
 * hooks — toasts live in UI components, not here.
 */

import { useQuery } from "@tanstack/react-query";
import { chatApi } from "../api/chatApi";

export const chatKeys = {
  all: ["chat"] as const,
  conversations: () => [...chatKeys.all, "conversations"] as const,
  messages: (conversationId: number) => [...chatKeys.all, "messages", conversationId] as const,
};

export function useConversationsQuery() {
  return useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: () => chatApi.listConversations(),
  });
}

/** `conversationId` is null for a peer with no conversation yet (a freshly-started "new chat") — the query stays disabled until one exists. */
export function useMessagesQuery(conversationId: number | null) {
  return useQuery({
    queryKey: chatKeys.messages(conversationId ?? -1),
    queryFn: () => chatApi.listMessages(conversationId as number),
    enabled: conversationId != null,
  });
}

/**
 * Global unread total (`GET /api/Conversations/unread-count`) — ready to
 * wire into a subtle nav badge once a provider layout has a slot for it.
 * // TODO: wire to backend — no existing nav slot for a chat badge was
 * // found on the workshop/scrap provider layouts; surface this hook's
 * // `data` there when one exists.
 */
export function useUnreadCountQuery() {
  return useQuery({
    queryKey: [...chatKeys.all, "unread-count"] as const,
    queryFn: () => chatApi.getUnreadCount(),
  });
}
