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
import { ArrowDown, ArrowRight, MessageSquare } from "lucide-react";
import { ProviderEmptyState } from "@shared/provider-ui";
import { cn } from "@shared/lib/utils";
import { ChatConnectionBanner } from "./ChatConnectionBanner";
import { DaySeparator } from "./DaySeparator";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import type { ChatMessage, ConnectionStatus, Conversation } from "../types";

export interface ChatWindowProps {
  peer: Conversation | null;
  messages: ChatMessage[];
  currentUserId: number;
  status: ConnectionStatus;
  onSend: (content: string) => Promise<void>;
  /** Shown on mobile only; returns to the conversation list. */
  onBack?: () => void;
}

/** Within this many px of the bottom counts as "already there" for auto-scroll purposes. */
const NEAR_BOTTOM_PX = 120;

export function ChatWindow({ peer, messages, currentUserId, status, onSend, onBack }: ChatWindowProps) {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);
  const prevPeerIdRef = useRef<number | null>(null);
  const prevLengthRef = useRef(0);
  const [showJumpPill, setShowJumpPill] = useState(false);

  const scrollToBottom = (behavior: ScrollBehavior) => {
    bottomRef.current?.scrollIntoView({ block: "end", behavior });
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
    const isOwnLastMessage = lastMessage != null && lastMessage.senderId === currentUserId;
    const hasNewMessages = messages.length > prevLengthRef.current;

    if (peerChanged) {
      isNearBottomRef.current = true;
      setShowJumpPill(false);
      scrollToBottom("auto");
    } else if (hasNewMessages) {
      if (isNearBottomRef.current || isOwnLastMessage) {
        scrollToBottom(prevLengthRef.current === 0 ? "auto" : "smooth");
        isNearBottomRef.current = true;
        setShowJumpPill(false);
      } else {
        setShowJumpPill(true);
      }
    }

    prevPeerIdRef.current = peer?.peerId ?? null;
    prevLengthRef.current = messages.length;
  }, [messages, peer?.peerId, currentUserId]);

  const handleSend = async (content: string) => {
    await onSend(content);
    isNearBottomRef.current = true;
    setShowJumpPill(false);
    requestAnimationFrame(() => scrollToBottom("smooth"));
  };

  if (!peer) {
    return (
      <div className="flex h-full flex-1 flex-col">
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
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-[var(--color-divider)] px-4 py-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            aria-label={t("chat.back")}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-ink-body)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-surface-2)] md:hidden rtl:rotate-180"
          >
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        )}
        <span className="truncate text-sm font-semibold text-[var(--color-ink-body)]">
          {peer.peerName}
        </span>
      </div>

      <div className="shrink-0">
        <ChatConnectionBanner status={status} />
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{ scrollbarWidth: "thin" }}
          className={cn(
            "h-full overflow-y-auto scroll-smooth px-4 py-3",
            "[&::-webkit-scrollbar]:w-1.5",
            "[&::-webkit-scrollbar-track]:bg-transparent",
            "[&::-webkit-scrollbar-thumb]:rounded-full",
            "[&::-webkit-scrollbar-thumb]:bg-[var(--color-divider)]",
          )}
        >
          {messages.length === 0 ? (
            <ProviderEmptyState
              icon={<MessageSquare className="h-8 w-8" aria-hidden />}
              title={t("chat.noMessagesTitle")}
              description={t("chat.noMessagesDescription")}
            />
          ) : (
            <div className="flex flex-col gap-2">
              {groups.map((group) => (
                <div key={group.dayKey} className="flex flex-col gap-2">
                  <DaySeparator date={group.dayKey} />
                  {group.messages.map((message) => (
                    <MessageBubble
                      key={messageKey(message)}
                      message={message}
                      isOwn={message.senderId === currentUserId}
                    />
                  ))}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
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
              "absolute bottom-3 left-1/2 -translate-x-1/2",
              "provider-fade-up flex items-center gap-1.5 rounded-[var(--radius-pill)]",
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

      <div className="shrink-0">
        <MessageComposer status={status} onSend={handleSend} />
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

function messageKey(message: ChatMessage): string {
  return `${message.senderId}-${message.receiverId}-${message.sentAt}-${message.content}`;
}
