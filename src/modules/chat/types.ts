/** Live Conversations DTOs, verified 2026-10-05. Keep storage URLs separate from local previews. */
export interface ChatAttachment {
  id: number;
  originalFileName: string | null;
  filePath: string | null;
  contentType: string | null;
  type: number;
  fileSize: number;
  createdAt: string;
  userName: string | null;
}
export interface ChatMessage {
  id: number;
  conversationId?: number;
  senderId: number;
  receiverId: number;
  senderName?: string;
  content: string;
  sentAt: string;
  isRead?: boolean;
  attachments: ChatAttachment[];
}
export interface Conversation {
  conversationId?: number;
  peerId: number;
  peerName: string;
  peerPhone?: string;
  lastMessage?: string;
  lastAt?: string;
  unreadCount: number;
}
export interface ConversationPage {
  items: Conversation[];
  page: number;
  totalPages: number;
  total: number;
}
export interface ConversationDetail {
  conversation: Conversation;
  messages: ChatMessage[];
}
export interface MessageInput {
  message: string | null;
  attachmentIds: number[];
}
export type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected";
export type ChatHubErrorCode =
  | "InvalidReceiverId"
  | "CannotSendToSelf"
  | "MessageEmpty"
  | "MessageTooLong"
  | "NotAuthenticated"
  | "Generic";
