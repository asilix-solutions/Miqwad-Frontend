/**
 * @file ChatWindow.tsx
 *
 * Active conversation pane: header (peer name + mobile back control),
 * an internally-scrolling message area grouped by day, connection banner,
 * and a composer pinned to the bottom. Auto-scrolls to the newest message
 * on mount/conversation switch and whenever a new message arrives while the
 * user is already near the bottom (or the new message is their own); if the
 * user has scrolled up to read history, a "new messages" pill appears
 * instead of yanking the view down.
 */

import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDown, ArrowLeft, MessageSquare } from "lucide-react";
import { ProviderEmptyState } from "@shared/provider-ui";
import { cn } from "@shared/lib/utils";
import { ChatConnectionBanner } from "./ChatConnectionBanner";
import { DaySeparator } from "./DaySeparator";
import { MessageBubble } from "./MessageBubble";
import type { ReactNode } from "react";
import type { ChatMessage, ConnectionStatus, Conversation } from "../types";

export interface ChatWindowProps {
  peer: Conversation | null;
  messages: ChatMessage[];
  currentUserId: number;
  status: ConnectionStatus;
  composer: ReactNode;
  onEdit: (id: number, text: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  /** Shown on mobile only; returns to the conversation list. */
  onBack?: () => void;
}

/** Within this many px of the bottom counts as "already there" for auto-scroll purposes. */
const NEAR_BOTTOM_PX = 120;

export function ChatWindow({
  peer,
  messages,
  currentUserId,
  status,
  composer,
  onEdit,
  onDelete,
  onBack,
}: ChatWindowProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const prevPeerIdRef = useRef<number | null>(null);
  const previous = useRef({ first: 0, last: 0, height: 0 });
  const [showJumpPill, setShowJumpPill] = useState(false);

  const scrollToBottom = (behavior: ScrollBehavior) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : behavior,
    });
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const near = distanceFromBottom <= NEAR_BOTTOM_PX;
    isNearBottomRef.current = near;
    if (near) setShowJumpPill(false);
  };

  useLayoutEffect(() => {
    const peerChanged = prevPeerIdRef.current !== (peer?.peerId ?? null);
    const lastMessage = messages[messages.length - 1];
    const el = scrollRef.current;
    const prior = previous.current;
    const first = messages[0]?.id ?? 0;
    const last = lastMessage?.id ?? 0;
    const prepended =
      prior.first !== 0 &&
      first !== prior.first &&
      last === prior.last &&
      messages.some((m) => m.id === prior.first);
    const appended =
      last !== prior.last && (prior.last === 0 || messages.some((m) => m.id === prior.last));

    if (peerChanged) {
      isNearBottomRef.current = true;
      setShowJumpPill(false);
      scrollToBottom("auto");
    } else if (prepended && el) {
      el.scrollTop += el.scrollHeight - prior.height;
    } else if (appended) {
      if (isNearBottomRef.current || lastMessage?.senderId === currentUserId) {
        scrollToBottom(prior.last === 0 ? "auto" : "smooth");
        isNearBottomRef.current = true;
        setShowJumpPill(false);
      } else {
        setShowJumpPill(true);
      }
    }

    prevPeerIdRef.current = peer?.peerId ?? null;
    previous.current = { first, last, height: el?.scrollHeight ?? 0 };
  }, [messages, peer?.peerId, currentUserId]);

  // Keep the bottom visible when previews/composer or the viewport change height.
  // Never scroll the page or pull someone away from older messages.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    const content = contentRef.current;
    if (!el || !content) return;
    const observer = new ResizeObserver(() => {
      if (isNearBottomRef.current) el.scrollTop = el.scrollHeight;
      previous.current.height = el.scrollHeight;
    });
    observer.observe(el);
    observer.observe(content);
    return () => observer.disconnect();
  }, [peer?.peerId]);

  if (!peer) {
    return (
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
        <ProviderEmptyState
          icon={<MessageSquare className="h-8 w-8" aria-hidden />}
          title={t("chat.emptyThreadTitle")}
          description={t("chat.emptyThreadDescription")}
          className="flex-1"
        />
      </div>
    );
  }

  const groups = groupByDay(messages);

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col">
      <div className="flex min-w-0 shrink-0 items-center gap-2 border-b border-[var(--color-divider)] px-3 py-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label={t("chat.back")}
            className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-ink-body)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-surface-2)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand-orange)] md:hidden rtl:rotate-180"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </button>
        )}
        <span className="min-w-0 truncate text-sm font-semibold text-[var(--color-ink-body)]">
          {peer.peerName || t("chat.media.unknownPeer")}
        </span>
      </div>

      <div className="shrink-0">
        <ChatConnectionBanner status={status} />
      </div>

      <div className="relative min-h-0 min-w-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{ scrollbarWidth: "thin", overflowAnchor: "none" }}
          className={cn(
            "h-full min-w-0 overflow-y-auto overscroll-contain px-2 py-3 sm:px-4",
            "[&::-webkit-scrollbar]:w-1.5",
            "[&::-webkit-scrollbar-track]:bg-transparent",
            "[&::-webkit-scrollbar-thumb]:rounded-full",
            "[&::-webkit-scrollbar-thumb]:bg-[var(--color-divider)]",
          )}
        >
          <div ref={contentRef} className="min-w-0">
            {messages.length === 0 ? (
              <ProviderEmptyState
                icon={<MessageSquare className="h-8 w-8" aria-hidden />}
                title={t("chat.noMessagesTitle")}
                description={t("chat.noMessagesDescription")}
              />
            ) : (
              <div className="flex min-w-0 flex-col gap-2">
                {groups.map((group) => (
                  <div key={group.dayKey} className="flex min-w-0 flex-col gap-2">
                    <DaySeparator date={group.dayKey} />
                    {group.messages.map((message) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwn={message.senderId === currentUserId}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showJumpPill && (
          <button
            type="button"
            onClick={() => {
              scrollToBottom("smooth");
              isNearBottomRef.current = true;
              setShowJumpPill(false);
            }}
            className={cn(
              "absolute bottom-3 left-1/2 max-w-[calc(100%-1rem)] -translate-x-1/2",
              "flex min-h-11 items-center gap-1.5 rounded-[var(--radius-pill)]",
              "border border-[var(--color-divider)] bg-[var(--color-surface)] px-3.5 py-1.5 shadow-sm",
              "text-xs font-medium text-[var(--color-ink-body)]",
              "transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-surface-2)]",
            )}
          >
            <ArrowDown className="h-3.5 w-3.5" aria-hidden />
            {t("chat.newMessages")}
          </button>
        )}
      </div>

      <div className="max-h-[60%] min-w-0 shrink-0 overflow-y-auto overscroll-contain">
        {composer}
      </div>
    </div>
  );
}

interface DayGroup {
  dayKey: string;
  messages: ChatMessage[];
}

function groupByDay(messages: ChatMessage[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const message of messages) {
    const dayKey = message.sentAt.slice(0, 10);
    const last = groups[groups.length - 1];
    if (last && last.dayKey === dayKey) {
      last.messages.push(message);
    } else {
      groups.push({ dayKey, messages: [message] });
    }
  }
  return groups;
}
