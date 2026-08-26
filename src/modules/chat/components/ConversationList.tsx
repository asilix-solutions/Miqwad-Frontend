/**
 * @file ConversationList.tsx
 *
 * List of conversations with client-side search (by peer name / last
 * message), unread badges, and active-row highlighting. Shows a warm empty
 * state when there are no conversations. Also hosts the "New chat" affordance
 * — the only way to start a conversation today, since no start-chat/user-
 * search source exists yet: the provider enters a peer's numeric user id
 * directly.
 */

import { useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { MessageSquare, Plus, X } from "lucide-react";
import { ProviderSearchBar, ProviderEmptyState, ProviderInput } from "@shared/provider-ui";
import { cn } from "@shared/lib/utils";
import type { Conversation } from "../types";

export interface ConversationListProps {
  conversations: Conversation[];
  activePeerId: number | null;
  /** Current user's numeric id — used to reject a self-chat before it reaches the hub. */
  currentUserId: number | null;
  onSelect: (peerId: number) => void;
  /** Starts (or resumes) a conversation with a peer entered by numeric id. */
  onStartChat: (peerId: number) => void;
}

export function ConversationList({
  conversations,
  activePeerId,
  currentUserId,
  onSelect,
  onStartChat,
}: ConversationListProps) {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState("");
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatId, setNewChatId] = useState("");
  const [newChatError, setNewChatError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return conversations;
    return conversations.filter(
      (c) =>
        c.peerName.toLowerCase().includes(query) ||
        (c.lastMessage ?? "").toLowerCase().includes(query),
    );
  }, [conversations, search]);

  const closeNewChat = () => {
    setIsNewChatOpen(false);
    setNewChatId("");
    setNewChatError(null);
  };

  // TODO: wire to backend — replace manual id entry with real context (order/offer
  //       party or user search) once the backend exposes a conversation-list / start-chat source.
  const handleNewChatSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = Number(newChatId);
    if (!Number.isInteger(parsed) || parsed <= 0) {
      setNewChatError(t("chat.newChat.invalidId"));
      return;
    }
    if (currentUserId !== null && parsed === currentUserId) {
      setNewChatError(t("chat.newChat.selfId"));
      return;
    }
    onStartChat(parsed);
    closeNewChat();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2 border-b border-[var(--color-divider)] p-3">
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <ProviderSearchBar
              value={search}
              onChange={setSearch}
              onClear={() => setSearch("")}
              placeholder={t("chat.searchPlaceholder")}
            />
          </div>
          <button
            type="button"
            onClick={() => setIsNewChatOpen((open) => !open)}
            aria-label={t("chat.newChat.title")}
            className={cn(
              "flex h-[var(--size-input-h)] w-[var(--size-input-h)] shrink-0 items-center justify-center",
              "rounded-[var(--radius-md)] border border-[var(--color-divider)] text-[var(--color-ink-body)]",
              "transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-surface-2)]",
            )}
          >
            {isNewChatOpen ? (
              <X className="h-4 w-4" aria-hidden />
            ) : (
              <Plus className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>

        {isNewChatOpen && (
          <form onSubmit={handleNewChatSubmit} className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <ProviderInput
                type="number"
                min={1}
                inputMode="numeric"
                value={newChatId}
                onChange={(e) => {
                  setNewChatId(e.target.value);
                  if (newChatError) setNewChatError(null);
                }}
                placeholder={t("chat.newChat.placeholder")}
                error={newChatError ?? undefined}
              />
            </div>
            <button
              type="submit"
              className={cn(
                "flex h-[var(--size-input-h)] shrink-0 items-center justify-center rounded-[var(--radius-md)]",
                "bg-[var(--color-brand-orange)] px-3.5 text-sm font-medium text-white",
                "transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-brand-orange-hover)]",
              )}
            >
              {t("chat.newChat.submit")}
            </button>
          </form>
        )}
      </div>

      {conversations.length === 0 ? (
        <ProviderEmptyState
          icon={<MessageSquare className="h-8 w-8" aria-hidden />}
          title={t("chat.emptyListTitle")}
          description={t("chat.emptyListDescription")}
          className="flex-1"
        />
      ) : (
        <ul className="flex-1 overflow-y-auto">
          {filtered.map((conversation) => {
            const isActive = conversation.peerId === activePeerId;
            const lastAt = conversation.lastAt
              ? new Intl.DateTimeFormat(i18n.language === "ar" ? "ar-SA" : "en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                }).format(new Date(conversation.lastAt))
              : "";

            return (
              <li key={conversation.peerId}>
                <button
                  type="button"
                  onClick={() => onSelect(conversation.peerId)}
                  className={cn(
                    "flex w-full items-start gap-3 border-b border-[var(--color-divider)] px-4 py-3.5 text-start",
                    "transition-colors duration-[var(--dur-fast)]",
                    isActive ? "bg-[var(--color-brand-50)]" : "hover:bg-[var(--color-surface-2)]",
                  )}
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-[var(--color-ink-body)]">
                        {conversation.peerName}
                      </span>
                      {lastAt && (
                        <span className="shrink-0 text-[11px] text-[var(--color-muted)]">{lastAt}</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-[var(--color-muted)]">
                        {conversation.lastMessage}
                      </span>
                      {conversation.unreadCount > 0 && (
                        <span
                          className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-brand-orange)] px-1.5 text-[10px] font-semibold text-white"
                          aria-label={t("chat.unreadLabel")}
                        >
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
