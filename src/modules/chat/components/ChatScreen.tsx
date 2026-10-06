import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { RefreshCw, ArrowRight } from "lucide-react";
import { useAppSelector } from "@app/store";
import { ProviderPageHeader, ProviderSkeleton } from "@shared/provider-ui";
import { cn } from "@shared/lib/utils";
import { chatApi } from "../api/chatApi";
import { useChatHub } from "../hooks/useChatHub";
import {
  chatKeys,
  useConversationsQuery,
  useMessagesQuery,
  useUnreadCountQuery,
} from "../hooks/useChatHistory";
import { useChatDrafts } from "../hooks/useChatDrafts";
import { resolveCurrentUserId } from "../lib/currentUser";
import { ConversationList } from "./ConversationList";
import { ChatWindow } from "./ChatWindow";
import { MessageComposer } from "./MessageComposer";
import type { Conversation, ConversationDetail, MessageInput } from "../types";

function subscribeVisibility(callback: () => void) {
  const media = window.matchMedia("(min-width: 768px)");
  media.addEventListener("change", callback);
  document.addEventListener("visibilitychange", callback);
  return () => {
    media.removeEventListener("change", callback);
    document.removeEventListener("visibilitychange", callback);
  };
}
const getVisibility = () =>
  `${document.visibilityState}:${window.matchMedia("(min-width: 768px)").matches}`;
export function ChatScreen({ role }: { role: "workshop" | "scrap" }) {
  const userId = resolveCurrentUserId(useAppSelector((state) => state.auth.user?.id)) ?? -1;
  // Remount drafts on account change; no media/draft state can cross users.
  return <ChatSession key={userId} role={role} userId={userId} />;
}
function ChatSession({ role, userId }: { role: "workshop" | "scrap"; userId: number }) {
  const { t, i18n } = useTranslation();
  const cache = useQueryClient();
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibility = useSyncExternalStore(subscribeVisibility, getVisibility, () => "hidden:false");
  const visible = visibility.startsWith("visible:") && (visibility.endsWith("true") || mobileOpen);
  const list = useConversationsQuery(userId, page);
  const unread = useUnreadCountQuery(userId);
  const peer =
    list.data?.items.find((c) => c.conversationId === selected?.conversationId) ?? selected;
  const id = peer?.conversationId ?? null;
  const draftKey = id !== null ? `conversation:${id}` : `new:${peer?.peerId}`;
  const history = useMessagesQuery(userId, id, visible);
  const { status, confirmDeleted, reconcileMessage } = useChatHub(userId, visible, id);
  const drafts = useChatDrafts();
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const refreshSummaries = useCallback(async () => {
    await Promise.all([
      cache.invalidateQueries({ queryKey: chatKeys.lists(userId) }),
      cache.invalidateQueries({ queryKey: chatKeys.unread(userId) }),
    ]);
  }, [cache, userId]);
  const [readError, setReadError] = useState<number | null>(null);
  const [readRetry, setReadRetry] = useState(0);
  const attempted = useRef("");
  const incoming = (history.data?.messages ?? [])
    .filter((m) => m.receiverId === userId)
    .map((m) => m.id)
    .join(",");
  useEffect(() => {
    if (!visible || id === null || !history.isSuccess) {
      attempted.current = "";
      return;
    }
    const attempt = `${id}:${incoming}:${readRetry}`;
    if (attempted.current === attempt) return;
    attempted.current = attempt;
    const viewedIds = new Set(incoming.split(",").filter(Boolean).map(Number));
    void chatApi
      .markRead(id)
      .then(() => {
        if (!alive.current) return;
        setReadError((failedId) => (failedId === id ? null : failedId));
        cache.setQueryData<ConversationDetail>(chatKeys.messages(userId, id), (old) =>
          old
            ? {
                ...old,
                messages: old.messages.map((m) =>
                  m.receiverId === userId && viewedIds.has(m.id) ? { ...m, isRead: true } : m,
                ),
              }
            : undefined,
        );
        void refreshSummaries();
      })
      .catch(() => {
        if (alive.current) setReadError(id);
      });
  }, [visible, id, incoming, readRetry, history.isSuccess, cache, userId, refreshSummaries]);
  const select = (conversation: Conversation) => {
    setSelected(conversation);
    setMobileOpen(true);
    setReadError(null);
  };
  const start = (peerId: number) => {
    select(
      list.data?.items.find((c) => c.peerId === peerId) ?? { peerId, peerName: "", unreadCount: 0 },
    );
  };
  const send = async (input: MessageInput) => {
    if (!alive.current) return;
    if (!peer || userId <= 0) throw new Error("Missing chat identity");
    if (id !== null) {
      const message = await chatApi.sendMessage(id, input);
      if (!alive.current) return;
      await cache.cancelQueries({ queryKey: chatKeys.messages(userId, id) });
      if (!alive.current) return;
      cache.setQueryData<ConversationDetail>(chatKeys.messages(userId, id), (old) =>
        old
          ? { ...old, messages: reconcileMessage(old.messages, message) }
          : { conversation: peer, messages: reconcileMessage([], message) },
      );
    } else {
      const result = await chatApi.createConversation({ ...input, receiverId: peer.peerId });
      if (!alive.current) return;
      const createdId = result.conversation.conversationId;
      if (createdId !== undefined) cache.setQueryData(chatKeys.messages(userId, createdId), result);
      setSelected((current) => (current === selected ? result.conversation : current));
    }
    void refreshSummaries();
  };
  const edit = async (messageId: number, text: string) => {
    if (id === null) return;
    const updated = await chatApi.editMessage(messageId, text);
    if (!alive.current) return;
    await cache.cancelQueries({ queryKey: chatKeys.messages(userId, id) });
    if (!alive.current) return;
    cache.setQueryData<ConversationDetail>(chatKeys.messages(userId, id), (old) =>
      old
        ? { ...old, messages: reconcileMessage(old.messages, { ...updated, conversationId: id }) }
        : undefined,
    );
    void refreshSummaries();
  };
  const remove = async (messageId: number) => {
    if (id === null) return;
    await chatApi.deleteMessage(messageId);
    if (!alive.current) return;
    confirmDeleted(messageId);
    await cache.cancelQueries({ queryKey: chatKeys.messages(userId, id) });
    if (!alive.current) return;
    cache.setQueryData<ConversationDetail>(chatKeys.messages(userId, id), (old) =>
      old ? { ...old, messages: old.messages.filter((m) => m.id !== messageId) } : undefined,
    );
    void refreshSummaries();
  };
  const reload = () => {
    void list.refetch();
    void unread.refetch();
    if (id !== null && visible) void history.refetch();
  };
  const retryButton = (onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center gap-2 rounded border px-3 text-sm"
    >
      <RefreshCw size={16} />
      {t("chat.errorRetry")}
    </button>
  );
  const draft = peer
    ? (drafts.drafts[draftKey] ?? { text: "", attachments: [], busy: false, uncertain: false })
    : null;
  return (
    <div
      dir={i18n.dir()}
      className="flex h-[calc(100dvh-112px)] min-h-[360px] min-w-0 flex-col gap-3 overflow-hidden"
    >
      <ProviderPageHeader title={t(`chat.title.${role}`)} subtitle={t(`chat.subtitle.${role}`)} />
      <div className="flex items-center justify-between gap-2 text-xs">
        <span role="status">
          {unread.isError
            ? t("chat.media.unreadFailed")
            : unread.data !== undefined
              ? t("chat.media.unreadTotal", { count: unread.data })
              : ""}
        </span>
        <button
          type="button"
          onClick={reload}
          className="inline-flex min-h-9 items-center gap-1 rounded border px-2"
        >
          <RefreshCw size={14} />
          {t("chat.media.refresh")}
        </button>
      </div>
      <div className="flex min-h-0 flex-1 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-divider)] bg-[var(--color-surface)]">
        <div
          className={cn(
            "flex w-full shrink-0 flex-col border-[var(--color-divider)] md:flex md:w-72 md:border-e",
            mobileOpen && "hidden",
          )}
        >
          {list.isPending ? (
            <div className="space-y-3 p-4">
              <ProviderSkeleton variant="block" height={56} />
              <ProviderSkeleton variant="block" height={56} />
            </div>
          ) : list.isError ? (
            <div role="alert" className="space-y-3 p-4">
              <p>{t("chat.errorTitle")}</p>
              {retryButton(() => void list.refetch())}
            </div>
          ) : (
            <div className="min-h-0 flex-1">
              <ConversationList
                conversations={list.data.items}
                activeConversationId={id}
                currentUserId={userId > 0 ? userId : null}
                onSelect={select}
                onStartChat={start}
              />
            </div>
          )}
          {list.data && (list.data.totalPages > 1 || page > 1) && (
            <nav
              aria-label={t("chat.media.pages")}
              className="flex items-center justify-between gap-2 border-t p-2 text-sm"
            >
              <button
                className="min-h-11 px-2"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                {t("chat.media.previous")}
              </button>
              <span>
                {page} / {list.data.totalPages}
              </span>
              <button
                className="min-h-11 px-2"
                disabled={page >= list.data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("chat.media.next")}
              </button>
            </nav>
          )}
        </div>
        <div className={cn("flex min-w-0 flex-1 flex-col", mobileOpen ? "flex" : "hidden md:flex")}>
          {readError !== null && readError === id && (
            <div role="alert" className="flex flex-wrap items-center gap-2 p-2 text-xs">
              {t("chat.media.readFailed")}
              {retryButton(() => setReadRetry((n) => n + 1))}
            </div>
          )}
          {id !== null && (history.isPending || history.isError) ? (
            <div className="space-y-3 p-4">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex min-h-11 items-center gap-2 md:hidden"
              >
                <ArrowRight size={18} />
                {t("chat.back")}
              </button>
              {history.isError ? (
                <>
                  <p role="alert">{t("chat.errorTitle")}</p>
                  {retryButton(() => void history.refetch())}
                </>
              ) : (
                <ProviderSkeleton variant="block" height={64} />
              )}
            </div>
          ) : (
            <ChatWindow
              key={draftKey}
              peer={peer}
              messages={history.data?.messages ?? []}
              currentUserId={userId}
              status={status}
              onEdit={edit}
              onDelete={remove}
              onBack={() => setMobileOpen(false)}
              composer={
                peer && draft ? (
                  <MessageComposer
                    key={draftKey}
                    status={status}
                    draft={draft}
                    onText={(value) => drafts.changeText(draftKey, value)}
                    onFiles={(files) => drafts.add(draftKey, files)}
                    onRemove={(attachmentId) => drafts.remove(draftKey, attachmentId)}
                    onSend={() => drafts.send(draftKey, send)}
                    onCheck={reload}
                    onDiscard={() => drafts.discard(draftKey)}
                  />
                ) : null
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
