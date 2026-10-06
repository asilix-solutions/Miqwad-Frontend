import { z } from "zod";
import { AppError } from "@shared/types/api";
import type { ChatMessage, Conversation, ConversationDetail, ConversationPage } from "../types";

const id = z.number().int().positive().refine(Number.isSafeInteger);
export const attachmentSchema = z.object({
  id,
  originalFileName: z.string().nullable(),
  filePath: z.string().nullable(),
  contentType: z.string().nullable(),
  type: z.number(),
  fileSize: z.number().nonnegative(),
  createdAt: z.string(),
  userName: z.string().nullable(),
});
const messageSchema = z.object({
  id,
  senderId: id,
  receiverId: id,
  message: z.string().nullable(),
  date: z.string(),
  isRead: z.boolean(),
  isSent: z.boolean(),
  attachments: z.array(attachmentSchema).nullable(),
});
const conversationSchema = z.object({
  conversationId: id,
  receiverId: id,
  receiverName: z.string().nullable(),
  phoneNumber: z.string().nullable(),
});
const summarySchema = conversationSchema.extend({
  lastMessage: z.string().nullable(),
  date: z.string().nullable(),
  unreadCount: z.number().int().nonnegative(),
});
export function parseContract<T>(schema: z.ZodType<T>, value: unknown): T {
  const parsed = schema.safeParse(value);
  if (!parsed.success) throw new AppError("Unexpected chat response", "CHAT_CONTRACT");
  return parsed.data;
}
export function unwrapChat(value: unknown): unknown {
  const envelope = parseContract(z.object({ success: z.boolean(), data: z.unknown() }), value);
  if (!envelope.success) throw new AppError("Chat request rejected", "CHAT_REJECTED");
  return envelope.data;
}
export function mapMessage(value: unknown, conversationId?: number): ChatMessage {
  const raw = parseContract(messageSchema, value);
  return {
    id: raw.id,
    senderId: raw.senderId,
    receiverId: raw.receiverId,
    content: raw.message ?? "",
    sentAt: raw.date,
    isRead: raw.isRead,
    conversationId,
    attachments: raw.attachments ?? [],
  };
}
function mapConversation(raw: z.infer<typeof conversationSchema>): Conversation {
  return {
    conversationId: raw.conversationId,
    peerId: raw.receiverId,
    peerName: raw.receiverName ?? "",
    peerPhone: raw.phoneNumber ?? undefined,
    unreadCount: 0,
  };
}
export function mapConversationPage(value: unknown): ConversationPage {
  // The old empty-account array shape remains supported at this single boundary.
  const raw = parseContract(
    z.union([
      z.array(summarySchema),
      z.object({
        items: z.array(summarySchema),
        pageNumber: z.number().int().positive(),
        totalCount: z.number().int().nonnegative(),
        totalPages: z.number().int().nonnegative(),
      }),
    ]),
    value,
  );
  const rows = Array.isArray(raw) ? raw : raw.items;
  return {
    items: rows.map((r) => ({
      ...mapConversation(r),
      lastMessage: r.lastMessage ?? undefined,
      lastAt: r.date ?? undefined,
      unreadCount: r.unreadCount,
    })),
    page: Array.isArray(raw) ? 1 : raw.pageNumber,
    totalPages: Array.isArray(raw) ? 1 : raw.totalPages,
    total: Array.isArray(raw) ? raw.length : raw.totalCount,
  };
}
export function mapDetail(value: unknown): ConversationDetail {
  const raw = parseContract(
    conversationSchema.extend({ messages: z.array(messageSchema).nullable() }),
    value,
  );
  return {
    conversation: mapConversation(raw),
    messages: (raw.messages ?? []).map((m) => mapMessage(m, raw.conversationId)),
  };
}
/** The current ReceiveMessage event has stable IDs; missing-ID legacy events trigger a refetch instead. */
export function mapHubMessage(value: unknown): ChatMessage | null {
  const parsed = z
    .object({
      id,
      conversationId: id,
      senderId: id,
      receiverId: id,
      senderName: z.string().nullable().optional(),
      content: z.string().nullable(),
      sentAt: z.string(),
      attachments: z.array(attachmentSchema).nullable(),
    })
    .safeParse(value);
  if (!parsed.success) return null;
  const r = parsed.data;
  return {
    id: r.id,
    conversationId: r.conversationId,
    senderId: r.senderId,
    receiverId: r.receiverId,
    senderName: r.senderName ?? undefined,
    content: r.content ?? "",
    sentAt: r.sentAt,
    attachments: r.attachments ?? [],
  };
}
/** Same ID replaces previous content; no timestamp/content heuristics or timing windows. */
export function upsertMessage(
  messages: ChatMessage[],
  incoming: ChatMessage,
  deletedIds?: ReadonlySet<number>,
): ChatMessage[] {
  if (deletedIds?.has(incoming.id)) return messages;
  const previous = messages.find((m) => m.id === incoming.id);
  const merged = {
    ...previous,
    ...incoming,
    isRead: previous?.isRead === true ? true : (incoming.isRead ?? previous?.isRead),
  };
  return [...messages.filter((m) => m.id !== incoming.id), merged].sort((a, b) => a.id - b.id);
}
/** ReceiveMessage is a creation event, never evidence that a later REST edit was reverted. */
export function mergeReceivedMessage(
  messages: ChatMessage[],
  incoming: ChatMessage,
  deletedIds: ReadonlySet<number>,
): ChatMessage[] {
  if (deletedIds.has(incoming.id) || messages.some((message) => message.id === incoming.id))
    return messages;
  return upsertMessage(messages, incoming);
}
export function safeMediaUrl(value: string | null): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
