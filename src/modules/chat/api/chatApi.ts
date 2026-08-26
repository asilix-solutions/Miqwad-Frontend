/**
 * @file chatApi.ts
 *
 * REST data layer for `/api/Conversations/*`, confirmed live 2026-08-25 by a
 * real probe against miqwad-test.runasp.net — see CHAT_REST_PROBE_REPORT.md
 * at the repo root for the raw request/response shapes this file maps.
 * SignalR (see ../lib/chatHub.ts) is now RECEIVE-ONLY: history, list, send,
 * and read-state all go through REST here.
 *
 * Envelope: every endpoint responds `{ success, message, data, errors }`
 * (same convention as ordersApi.ts / categoryAdapter.ts) — `unwrap()` below
 * throws an AppError on `success: false` so callers never see the envelope.
 *
 * SOURCE SWITCH — CHAT_SOURCE stays the single toggle. "live" is the
 * effective default below, fully wired end-to-end (ChatScreen/hooks call
 * these endpoints directly — see ../components/ChatScreen.tsx); "fixture"
 * remains for local UI review without a backend, still exercised through
 * the same hooks/components (no separate code path in the UI layer).
 *
 *   const CHAT_SOURCE: "fixture" | "live" = "fixture";
 */

import { apiClient } from "@shared/lib/axios";
import { AppError } from "@shared/types/api";
import type { ApiEnvelope } from "@modules/services/lib/categoryAdapter";
import type { ChatMessage, Conversation } from "../types";

// ── Source switch ────────────────────────────────────────────────────────────

// Cast through `string` so TS doesn't narrow this const to a single literal
// and flag the "fixture" branches below as dead code — this value is meant
// to be hand-edited, not computed, so both branches must stay type-checkable.
export const CHAT_SOURCE = "live" as string as "fixture" | "live";

// ── Raw REST DTOs (backend casing, pre-mapping) ─────────────────────────────

/** GET /api/Conversations — one list row. */
interface RawConversationListItem {
  conversationId: number;
  receiverId: number;
  receiverName: string;
  phoneNumber: string;
  lastMessage: string | null;
  date: string;
  unreadCount: number;
}

/**
 * Paginated wrapper a populated account returns for `data` (list rows live at
 * `data.items`). An empty/near-empty account instead returns a bare array
 * directly as `data` — both shapes are real and must be tolerated (see
 * chatApi.ts file header).
 */
interface RawPaginatedList<T> {
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  items: T[];
}

/** Flat message shape shared by #5 send, #7 get, #8 edit, and nested in #2/#3. */
interface RawMessage {
  id: number;
  senderId: number;
  receiverId: number;
  message: string;
  isRead: boolean;
  isSent: boolean;
  date: string;
}

/**
 * POST /api/Conversations and GET /api/Conversations/{id} — hydrated conversation
 * + messages. `messages` is the assumed shape; `items` is tolerated as an alias
 * in case this endpoint also switches to the paginated-envelope convention seen
 * on GET /api/Conversations (unverified live — see mapRestConversationDetail).
 */
interface RawConversationDetail {
  conversationId: number;
  receiverId: number;
  receiverName: string;
  phoneNumber: string;
  messages?: RawMessage[];
  items?: RawMessage[];
}

interface RawUnreadCount {
  unreadCount: number;
}

// ── Mappers — the one boundary where REST casing becomes app-side `ChatMessage`/`Conversation` ──

function mapRestMessage(raw: RawMessage, conversationId?: number): ChatMessage {
  return {
    id: raw.id,
    conversationId,
    senderId: raw.senderId,
    receiverId: raw.receiverId,
    content: raw.message,
    sentAt: raw.date,
    isRead: raw.isRead,
  };
}

function mapRestConversationListItem(raw: RawConversationListItem): Conversation {
  return {
    conversationId: raw.conversationId,
    peerId: raw.receiverId,
    peerName: raw.receiverName,
    peerPhone: raw.phoneNumber,
    lastMessage: raw.lastMessage ?? undefined,
    lastAt: raw.date,
    unreadCount: raw.unreadCount,
  };
}

/**
 * The detail response (create/get-by-id) carries no `lastMessage`/`date`/
 * `unreadCount` — those only exist on the list-endpoint row. Callers that
 * need the full Conversation card should prefer the list, or merge with a
 * previously-fetched list row; this mapper leaves those fields undefined/0
 * rather than guessing.
 */
function mapRestConversationDetail(raw: RawConversationDetail): {
  conversation: Conversation;
  messages: ChatMessage[];
} {
  return {
    conversation: {
      conversationId: raw.conversationId,
      peerId: raw.receiverId,
      peerName: raw.receiverName,
      peerPhone: raw.phoneNumber,
      unreadCount: 0,
    },
    messages: (raw.messages ?? raw.items ?? []).map((m) => mapRestMessage(m, raw.conversationId)),
  };
}

/**
 * Tolerates both the bare-array shape (empty/near-empty accounts) and the
 * paginated-envelope shape `{ items: [...] }` (populated accounts) seen on
 * GET /api/Conversations — see chatApi.ts file header and CHAT_REST_PROBE_REPORT.md.
 */
function unwrapListItems<T>(data: T[] | RawPaginatedList<T>): T[] {
  return Array.isArray(data) ? data : (data.items ?? []);
}

function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success) throw new AppError(envelope.message || "Request failed", "CHAT_REQUEST_FAILED");
  return envelope.data;
}

// ── Fixture data ─────────────────────────────────────────────────────────────

const FIXTURE_CONVERSATIONS: Conversation[] = [
  {
    conversationId: 201,
    peerId: 201,
    peerName: "محمد العمري",
    peerRole: "customer",
    lastMessage: "هل القطعة متوفرة الآن؟",
    lastAt: new Date(Date.now() - 12 * 60_000).toISOString(),
    unreadCount: 2,
  },
  {
    conversationId: 202,
    peerId: 202,
    peerName: "Sara Al-Qahtani",
    peerRole: "customer",
    lastMessage: "Thanks, see you tomorrow!",
    lastAt: new Date(Date.now() - 3 * 3_600_000).toISOString(),
    unreadCount: 0,
  },
  {
    conversationId: 203,
    peerId: 203,
    peerName: "خالد البقمي",
    peerRole: "customer",
    lastMessage: "تمام، شاكر لك",
    lastAt: new Date(Date.now() - 26 * 3_600_000).toISOString(),
    unreadCount: 0,
  },
  {
    conversationId: 204,
    peerId: 204,
    peerName: "فيصل الدوسري",
    peerRole: "customer",
    lastMessage: "أرسل لي السعر النهائي من فضلك",
    lastAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    unreadCount: 5,
  },
  {
    conversationId: 205,
    peerId: 205,
    peerName: "Omar Nasser",
    peerRole: "customer",
    lastMessage: "Is the part still available?",
    lastAt: new Date(Date.now() - 6 * 86_400_000).toISOString(),
    unreadCount: 0,
  },
];

const CURRENT_USER_ID = 1;
const CURRENT_USER_NAME = "أنت";

const FIXTURE_MESSAGES: Record<number, ChatMessage[]> = {
  201: [
    {
      senderId: 201,
      senderName: "محمد العمري",
      receiverId: CURRENT_USER_ID,
      content: "السلام عليكم، هل لديكم مرفاع أمامي لسيارة كامري 2019؟",
      sentAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    },
    {
      senderId: CURRENT_USER_ID,
      senderName: CURRENT_USER_NAME,
      receiverId: 201,
      content: "وعليكم السلام، نعم متوفر عندنا بحالة ممتازة",
      sentAt: new Date(Date.now() - 2 * 86_400_000 + 5 * 60_000).toISOString(),
    },
    {
      senderId: 201,
      senderName: "محمد العمري",
      receiverId: CURRENT_USER_ID,
      content: "كم السعر؟",
      sentAt: new Date(Date.now() - 90 * 60_000).toISOString(),
    },
    {
      senderId: 201,
      senderName: "محمد العمري",
      receiverId: CURRENT_USER_ID,
      content: "هل القطعة متوفرة الآن؟",
      sentAt: new Date(Date.now() - 12 * 60_000).toISOString(),
    },
  ],
  202: [
    {
      senderId: 202,
      senderName: "Sara Al-Qahtani",
      receiverId: CURRENT_USER_ID,
      content: "Hi, do you have a water pump for a Patrol 2017?",
      sentAt: new Date(Date.now() - 4 * 3_600_000).toISOString(),
    },
    {
      senderId: CURRENT_USER_ID,
      senderName: CURRENT_USER_NAME,
      receiverId: 202,
      content: "Yes, we have one in stock. 250 SAR.",
      sentAt: new Date(Date.now() - 3.5 * 3_600_000).toISOString(),
    },
    {
      senderId: 202,
      senderName: "Sara Al-Qahtani",
      receiverId: CURRENT_USER_ID,
      content: "Thanks, see you tomorrow!",
      sentAt: new Date(Date.now() - 3 * 3_600_000).toISOString(),
    },
  ],
  203: [
    {
      senderId: 203,
      senderName: "خالد البقمي",
      receiverId: CURRENT_USER_ID,
      content: "وصلت القطعة، شغالة تمام",
      sentAt: new Date(Date.now() - 27 * 3_600_000).toISOString(),
    },
    {
      senderId: CURRENT_USER_ID,
      senderName: CURRENT_USER_NAME,
      receiverId: 203,
      content: "الحمدلله، سعدت بخدمتك",
      sentAt: new Date(Date.now() - 26.5 * 3_600_000).toISOString(),
    },
    {
      senderId: 203,
      senderName: "خالد البقمي",
      receiverId: CURRENT_USER_ID,
      content: "تمام، شاكر لك",
      sentAt: new Date(Date.now() - 26 * 3_600_000).toISOString(),
    },
  ],
  204: [
    {
      senderId: 204,
      senderName: "فيصل الدوسري",
      receiverId: CURRENT_USER_ID,
      content: "أبغى كمبروسر تكييف لسيارة X5 2018",
      sentAt: new Date(Date.now() - 3 * 86_400_000).toISOString(),
    },
    {
      senderId: CURRENT_USER_ID,
      senderName: CURRENT_USER_NAME,
      receiverId: 204,
      content: "عندنا قطعة مستعملة بحالة جيدة جداً",
      sentAt: new Date(Date.now() - 2.8 * 86_400_000).toISOString(),
    },
    {
      senderId: 204,
      senderName: "فيصل الدوسري",
      receiverId: CURRENT_USER_ID,
      content: "طيب كم السعر مع التركيب؟",
      sentAt: new Date(Date.now() - 2.2 * 86_400_000).toISOString(),
    },
    {
      senderId: 204,
      senderName: "فيصل الدوسري",
      receiverId: CURRENT_USER_ID,
      content: "أرسل لي السعر النهائي من فضلك",
      sentAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    },
  ],
  205: [
    {
      senderId: 205,
      senderName: "Omar Nasser",
      receiverId: CURRENT_USER_ID,
      content: "Is the part still available?",
      sentAt: new Date(Date.now() - 6 * 86_400_000).toISOString(),
    },
  ],
};

const FIXTURE_UNREAD_TOTAL = FIXTURE_CONVERSATIONS.reduce((sum, c) => sum + c.unreadCount, 0);

// ── API surface ──────────────────────────────────────────────────────────────

export const chatApi = {
  /**
   * GET /api/Conversations. A populated account returns a paginated envelope
   * (`data.items`); an empty/near-empty account returns a bare array as `data`
   * (the original probe only saw this second case). Both are tolerated here —
   * see `unwrapListItems` and the file header.
   */
  // TODO: wire pagination UI when lists grow — pageNumber/pageSize/totalCount/totalPages are available on the envelope but unused for now.
  listConversations: async (): Promise<Conversation[]> => {
    if (CHAT_SOURCE === "fixture") {
      return [...FIXTURE_CONVERSATIONS].sort(
        (a, b) => new Date(b.lastAt ?? 0).getTime() - new Date(a.lastAt ?? 0).getTime(),
      );
    }

    const { data } = await apiClient.get<
      ApiEnvelope<RawConversationListItem[] | RawPaginatedList<RawConversationListItem>>
    >("/Conversations");
    return unwrapListItems(unwrap(data)).map(mapRestConversationListItem);
  },

  /** GET /api/Conversations/{id}. Returns the conversation header (no lastMessage/date/unreadCount — see mapRestConversationDetail). */
  getConversation: async (conversationId: number): Promise<Conversation> => {
    if (CHAT_SOURCE === "fixture") {
      const found = FIXTURE_CONVERSATIONS.find((c) => c.conversationId === conversationId);
      if (!found) throw new AppError("Conversation not found", "NOT_FOUND", 404);
      return found;
    }

    const { data } = await apiClient.get<ApiEnvelope<RawConversationDetail>>(
      `/Conversations/${conversationId}`,
    );
    return mapRestConversationDetail(unwrap(data)).conversation;
  },

  /**
   * POST /api/Conversations — "start new chat" IS "send first message"; the
   * backend creates-or-returns the conversation and returns it fully
   * hydrated with the seed message inside `messages[]` (probe report §2).
   */
  createConversation: async (input: {
    receiverId: number;
    message: string;
  }): Promise<{ conversation: Conversation; firstMessage: ChatMessage }> => {
    if (CHAT_SOURCE === "fixture") {
      const now = new Date().toISOString();
      const message: ChatMessage = {
        id: Date.now(),
        conversationId: input.receiverId,
        senderId: CURRENT_USER_ID,
        senderName: CURRENT_USER_NAME,
        receiverId: input.receiverId,
        content: input.message,
        sentAt: now,
        isRead: false,
      };
      const conversation: Conversation = {
        conversationId: input.receiverId,
        peerId: input.receiverId,
        peerName: String(input.receiverId),
        lastMessage: input.message,
        lastAt: now,
        unreadCount: 0,
      };
      return { conversation, firstMessage: message };
    }

    const { data } = await apiClient.post<ApiEnvelope<RawConversationDetail>>("/Conversations", {
      receiverId: input.receiverId,
      message: input.message,
    });
    const { conversation, messages } = mapRestConversationDetail(unwrap(data));
    return { conversation, firstMessage: messages[messages.length - 1] };
  },

  /** GET /api/Conversations/{id} — full history, ascending (oldest → newest), no pagination (probe report §3). */
  // TODO: pagination when backend enforces it — currently returns the full history unpaginated.
  listMessages: async (conversationId: number): Promise<ChatMessage[]> => {
    if (CHAT_SOURCE === "fixture") {
      return FIXTURE_MESSAGES[conversationId] ?? [];
    }

    const { data } = await apiClient.get<ApiEnvelope<RawConversationDetail>>(
      `/Conversations/${conversationId}`,
    );
    return mapRestConversationDetail(unwrap(data)).messages;
  },

  /** POST /api/Conversations/{conversationId}/messages. Returns the flat Message DTO with a real `id` — this is the single write path now (probe report §5). */
  sendMessage: async (conversationId: number, content: string): Promise<ChatMessage> => {
    if (CHAT_SOURCE === "fixture") {
      const message: ChatMessage = {
        id: Date.now(),
        conversationId,
        senderId: CURRENT_USER_ID,
        senderName: CURRENT_USER_NAME,
        receiverId: conversationId,
        content,
        sentAt: new Date().toISOString(),
        isRead: false,
      };
      FIXTURE_MESSAGES[conversationId] = [...(FIXTURE_MESSAGES[conversationId] ?? []), message];
      return message;
    }

    const { data } = await apiClient.post<ApiEnvelope<RawMessage>>(
      `/Conversations/${conversationId}/messages`,
      { message: content },
    );
    return mapRestMessage(unwrap(data), conversationId);
  },

  /** GET /api/Conversations/messages/{messageId}. */
  getMessage: async (messageId: number): Promise<ChatMessage> => {
    if (CHAT_SOURCE === "fixture") {
      const found = Object.values(FIXTURE_MESSAGES)
        .flat()
        .find((m) => m.id === messageId);
      if (!found) throw new AppError("Message not found", "NOT_FOUND", 404);
      return found;
    }

    const { data } = await apiClient.get<ApiEnvelope<RawMessage>>(`/Conversations/messages/${messageId}`);
    return mapRestMessage(unwrap(data));
  },

  /** PUT /api/Conversations/messages/{messageId}. No `editedAt`/`isEdited` in the DTO — nowhere to source an "edited" indicator from (probe report §8). */
  editMessage: async (messageId: number, content: string): Promise<ChatMessage> => {
    if (CHAT_SOURCE === "fixture") {
      for (const list of Object.values(FIXTURE_MESSAGES)) {
        const found = list.find((m) => m.id === messageId);
        if (found) {
          found.content = content;
          return found;
        }
      }
      throw new AppError("Message not found", "NOT_FOUND", 404);
    }

    const { data } = await apiClient.put<ApiEnvelope<RawMessage>>(
      `/Conversations/messages/${messageId}`,
      { message: content },
    );
    return mapRestMessage(unwrap(data));
  },

  /** DELETE /api/Conversations/messages/{messageId}. */
  deleteMessage: async (messageId: number): Promise<void> => {
    if (CHAT_SOURCE === "fixture") {
      for (const key of Object.keys(FIXTURE_MESSAGES)) {
        const peerId = Number(key);
        FIXTURE_MESSAGES[peerId] = FIXTURE_MESSAGES[peerId].filter((m) => m.id !== messageId);
      }
      return;
    }

    await apiClient.delete(`/Conversations/messages/${messageId}`);
  },

  /** GET /api/Conversations/unread-count. Global total only — per-conversation counts come from listConversations() instead (probe report §4). */
  getUnreadCount: async (): Promise<number> => {
    if (CHAT_SOURCE === "fixture") {
      return FIXTURE_UNREAD_TOTAL;
    }

    const { data } = await apiClient.get<ApiEnvelope<RawUnreadCount>>("/Conversations/unread-count");
    return unwrap(data).unreadCount;
  },

  /** PUT /api/Conversations/{conversationId}/read. No body, `data: null` response (probe report §6). */
  markRead: async (conversationId: number): Promise<void> => {
    if (CHAT_SOURCE === "fixture") {
      const conversation = FIXTURE_CONVERSATIONS.find((c) => c.conversationId === conversationId);
      if (conversation) conversation.unreadCount = 0;
      return;
    }

    await apiClient.put(`/Conversations/${conversationId}/read`);
  },
};
