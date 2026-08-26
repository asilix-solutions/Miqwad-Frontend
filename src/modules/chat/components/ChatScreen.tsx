/**
 * @file ChatScreen.tsx
 *
 * Chat screen assembly for a provider role (workshop/scrap). REST
 * (`chatApi`) is the source of truth for the conversation list, message
 * history, and read-state — confirmed live, see
 * ../../../../CHAT_REST_PROBE_REPORT.md. SignalR (`useChatHub`) stays
 * receive-only for live inbound delivery; sending goes through
 * `chatApi.sendMessage`/`createConversation`, which return a real message
 * id immediately instead of waiting on a refetch. History persists across
 * refresh since it's REST-backed, not session-only.
 *
 * Responsive shell: two-pane on desktop (list + window both visible),
 * single-pane push navigation on mobile (list, then window with a back
 * control).
 */

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@app/store";
import { ProviderPageHeader, ProviderSkeleton } from "@shared/provider-ui";
import { cn } from "@shared/lib/utils";
import { chatApi } from "../api/chatApi";
import { useChatHub } from "../hooks/useChatHub";
import { useConversationsQuery, useMessagesQuery } from "../hooks/useChatHistory";
import { resolveCurrentUserId } from "../lib/currentUser";
import {
  clearUnread,
  messageReconciled,
  messageSendFailed,
  messageSent,
  selectActivePeerId,
  selectConversations,
  selectMessagesFor,
  setActivePeer,
  setConversations,
  upsertConversation,
} from "../store/chatSlice";
import { ConversationList } from "./ConversationList";
import { ChatWindow } from "./ChatWindow";
import type { ChatMessage, Conversation } from "../types";

export interface ChatScreenProps {
  role: "workshop" | "scrap";
}

export function ChatScreen({ role }: ChatScreenProps) {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();

  // null when unavailable/non-numeric — falls back to a sentinel that never
  // matches a real senderId, so own/peer disambiguation defaults to "peer"
  // instead of crashing.
  const currentUserId = resolveCurrentUserId(useAppSelector((state) => state.auth.user?.id));

  const { status } = useChatHub();
  const activePeerId = useAppSelector(selectActivePeerId);
  const liveMessages = useAppSelector(selectMessagesFor(activePeerId ?? -1));
  const conversations = useAppSelector(selectConversations);

  const {
    data: fetchedConversations,
    isLoading: isConversationsLoading,
    isError: isConversationsError,
    refetch: refetchConversations,
  } = useConversationsQuery();

  useEffect(() => {
    if (fetchedConversations) dispatch(setConversations(fetchedConversations));
  }, [fetchedConversations, dispatch]);

  const activeConversationId = useMemo(
    () => conversations.find((c) => c.peerId === activePeerId)?.conversationId ?? null,
    [conversations, activePeerId],
  );

  const {
    data: historyMessages,
    isLoading: isMessagesLoading,
    isError: isMessagesError,
    refetch: refetchMessages,
  } = useMessagesQuery(activeConversationId);

  // Merge strategy: REST history (authoritative, ascending, has ids) is the
  // base thread; live Redux messages for the same peer (received via
  // SignalR, sent optimistically, or reconciled with a real REST id) are
  // appended after it. De-dup by `id` when the live message carries one
  // (already reconciled against REST); otherwise by
  // senderId+receiverId+sentAt+content (a SignalR-origin message not yet
  // reconciled has no id to match against).
  const mergedMessages = useMemo<ChatMessage[]>(() => {
    const base = historyMessages ?? [];
    const baseIds = new Set(base.map((m) => m.id).filter((id): id is number => id != null));
    const baseContentKeys = new Set(base.map(contentKey));
    const appended = liveMessages.filter((m) =>
      m.id != null ? !baseIds.has(m.id) : !baseContentKeys.has(contentKey(m)),
    );
    return [...base, ...appended];
  }, [historyMessages, liveMessages]);

  const [showWindowOnMobile, setShowWindowOnMobile] = useState(false);

  const activePeer = useMemo<Conversation | null>(() => {
    if (activePeerId == null) return null;
    const known = conversations.find((c) => c.peerId === activePeerId);
    // A freshly-started chat (via "New chat") has no conversation yet, so it
    // won't appear in the REST-hydrated list — show a minimal stand-in
    // until the first message round-trips and creates one.
    return known ?? { peerId: activePeerId, peerName: String(activePeerId), unreadCount: 0 };
  }, [conversations, activePeerId]);

  const handleSelect = (peerId: number) => {
    dispatch(setActivePeer(peerId));
    dispatch(clearUnread(peerId));
    setShowWindowOnMobile(true);

    const conversationId = conversations.find((c) => c.peerId === peerId)?.conversationId;
    if (conversationId != null) {
      void chatApi.markRead(conversationId).catch(() => {
        // Best-effort — local unread is already cleared; a failed server
        // sync just means the badge could reappear on the next
        // listConversations() refetch, which is acceptable.
      });
    }
  };

  const handleSend = async (content: string) => {
    if (activePeerId == null || currentUserId == null) return;

    // Optimistic append — shown immediately, reconciled with the real REST
    // message (real id) once the send resolves, or rolled back on failure.
    // Negative ids never collide with a real REST id (always positive).
    const tempId = -Date.now();
    const optimistic: ChatMessage = {
      id: tempId,
      senderId: currentUserId,
      receiverId: activePeerId,
      content,
      sentAt: new Date().toISOString(),
      isRead: false,
    };
    dispatch(messageSent(optimistic));

    try {
      const existingConversationId = conversations.find(
        (c) => c.peerId === activePeerId,
      )?.conversationId;

      if (existingConversationId != null) {
        const real = await chatApi.sendMessage(existingConversationId, content);
        dispatch(messageReconciled({ peerId: activePeerId, tempId, message: real }));
      } else {
        // Brand-new peer, no conversation yet — create-or-return (confirmed
        // live: POSTing to a peer who already has a conversation reopens it
        // rather than duplicating it, see the probe report).
        const { conversation, firstMessage } = await chatApi.createConversation({
          receiverId: activePeerId,
          message: content,
        });
        dispatch(messageReconciled({ peerId: activePeerId, tempId, message: firstMessage }));
        dispatch(upsertConversation(conversation));
        void refetchConversations();
      }
    } catch (error) {
      dispatch(messageSendFailed({ peerId: activePeerId, tempId }));
      throw error;
    }
  };

  return (
    <div className="flex h-[calc(100dvh-112px)] min-h-[420px] flex-col gap-4 overflow-hidden">
      <ProviderPageHeader
        title={t(`chat.title.${role}`)}
        subtitle={t(`chat.subtitle.${role}`)}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-divider)] bg-[var(--color-surface)]">
        {/* Conversation list — always visible on desktop; on mobile, hidden once a peer is selected */}
        <div
          className={cn(
            "w-full shrink-0 border-[var(--color-divider)] md:block md:w-[320px] md:border-e",
            showWindowOnMobile ? "hidden md:block" : "block",
          )}
        >
          {isConversationsLoading ? (
            <div className="flex flex-col gap-3 p-4">
              <ProviderSkeleton variant="block" height={56} />
              <ProviderSkeleton variant="block" height={56} />
              <ProviderSkeleton variant="block" height={56} />
            </div>
          ) : isConversationsError ? (
            <div className="flex flex-col items-center gap-3 p-8 text-center">
              <AlertCircle className="h-6 w-6 text-[var(--color-danger-500)]" aria-hidden />
              <p className="text-sm text-[var(--color-ink-body)]">{t("chat.errorTitle")}</p>
              <button
                type="button"
                onClick={() => void refetchConversations()}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-divider)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-body)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-surface-2)]"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                {t("chat.errorRetry")}
              </button>
            </div>
          ) : (
            <ConversationList
              conversations={conversations}
              activePeerId={activePeerId}
              currentUserId={currentUserId}
              onSelect={handleSelect}
              onStartChat={handleSelect}
            />
          )}
        </div>

        {/* Chat window — hidden on mobile until a peer is selected */}
        <div className={cn("min-w-0 flex-1", showWindowOnMobile ? "block" : "hidden md:block")}>
          {activePeerId != null && isMessagesLoading ? (
            <div className="flex h-full flex-col gap-3 p-4">
              <ProviderSkeleton variant="block" height={40} />
              <ProviderSkeleton variant="block" height={64} />
              <ProviderSkeleton variant="block" height={64} />
            </div>
          ) : activePeerId != null && isMessagesError ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <AlertCircle className="h-6 w-6 text-[var(--color-danger-500)]" aria-hidden />
              <p className="text-sm text-[var(--color-ink-body)]">{t("chat.errorTitle")}</p>
              <button
                type="button"
                onClick={() => void refetchMessages()}
                className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-divider)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-body)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-surface-2)]"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                {t("chat.errorRetry")}
              </button>
            </div>
          ) : (
            <ChatWindow
              peer={activePeer}
              messages={mergedMessages}
              currentUserId={currentUserId ?? Number.NaN}
              status={status}
              onSend={handleSend}
              onBack={() => setShowWindowOnMobile(false)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function contentKey(message: ChatMessage): string {
  return `${message.senderId}:${message.receiverId}:${message.sentAt}:${message.content}`;
}
