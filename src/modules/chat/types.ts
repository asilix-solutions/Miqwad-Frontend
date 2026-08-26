/**
 * Chat module app-facing types.
 *
 * REST (`/api/Conversations/*`, confirmed live 2026-08-25 — see
 * ../../../../CHAT_REST_PROBE_REPORT.md) is now the source of truth for
 * conversation list, history, send, and read-state; ids are real (backend
 * `Message.id`, `Conversation.conversationId`). SignalR (`ReceiveMessage`) is
 * receive-only for live inbound delivery — its `ChatMessageDto` carries no
 * `id`/`isRead`, so a message that arrives live is a display-only append
 * until the next REST refetch reconciles it.
 *
 * `ChatMessage` below is the ONE shape the rest of the app consumes for a
 * message, regardless of origin:
 *  - From REST (`chatApi`): `id`, `conversationId`, `isRead` are populated;
 *    `content` is mapped from the REST field `message`.
 *  - From SignalR (`chatHub` → `ReceiveMessage`): `id`/`conversationId`/
 *    `isRead` are absent; `content` is mapped from the hub's own `content`
 *    field (already matches, no rename needed there); `senderName` is only
 *    ever populated this way (REST carries the peer's name on the
 *    Conversation, not the Message).
 */

export interface ChatMessage {
  /** REST message id. Absent for a message that arrived live via SignalR and hasn't been reconciled against a REST refetch yet. */
  id?: number;
  /** REST conversation id this message belongs to. Absent for SignalR-origin messages (the hub has no concept of conversationId). */
  conversationId?: number;
  senderId: number;
  /** Only ever populated for SignalR-origin messages; REST's flat Message DTO carries no sender name. */
  senderName?: string;
  receiverId: number;
  content: string;
  /** ISO 8601 — format to local time on display. */
  sentAt: string;
  /** REST-only; absent for SignalR-origin messages (the hub has no read-state concept). */
  isRead?: boolean;
}

export interface Conversation {
  /**
   * REST conversation id — primary key once REST-sourced. Optional because
   * session-derived conversations (built from live SignalR traffic before
   * any REST list call, or the ChatScreen stand-in for a freshly-started
   * "new chat") don't have one yet.
   */
  conversationId?: number;
  /** Peer's user id — REST's `receiverId` / SignalR's `senderId`, same numeric space either way. */
  peerId: number;
  peerName: string;
  /** REST-only (`phoneNumber`); not carried by SignalR or session-derived conversations. */
  peerPhone?: string;
  peerRole?: string;
  lastMessage?: string;
  lastAt?: string;
  unreadCount: number;
}

export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";

/**
 * Error codes the chat hub throws from SendMessage. Mapped to bilingual
 * copy in the composer — see chat.errors.* in i18n.
 *
 * // TODO: Phase B — SendMessage invoke is deprecated (see ../lib/chatHub.ts);
 * // once sending moves fully to REST these become REST error-response codes
 * // instead of hub exception messages.
 */
export type ChatHubErrorCode =
  | "InvalidReceiverId"
  | "CannotSendToSelf"
  | "MessageEmpty"
  | "MessageTooLong"
  | "NotAuthenticated"
  | "Generic";
