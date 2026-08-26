import { createSelector, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ChatMessage, ConnectionStatus, Conversation } from "../types";

/**
 * Chat module slice — connection status, active peer, REST-hydrated
 * conversation list, and per-peer message/unread state.
 *
 * KEYING DECISION: `messagesByPeer`/`unreadByPeer` stay keyed by **peerId**
 * (not conversationId). Reasons:
 *  - It's the key SignalR's inbound `ReceiveMessage` has always used (the
 *    hub has no concept of conversationId), and the hub stays live/inbound
 *    (see ../hooks/useChatHub.ts).
 *  - A conversation is 1:1 with a peer in this backend (confirmed live —
 *    see CHAT_REST_PROBE_REPORT.md), so peerId is already a valid unique
 *    key — conversationId adds no disambiguation.
 *  - Each `ChatMessage` still carries its own optional `conversationId`
 *    (see ../types.ts) for whichever caller needs it (e.g.
 *    `chatApi.sendMessage`, `chatApi.markRead`) — callers resolve it by
 *    looking up the matching row in `conversations` by `peerId`.
 *
 * `conversations` is REST-hydrated (`chatApi.listConversations()`, fed via
 * `setConversations`) and kept in sync with optimistic local writes
 * (`upsertConversation` on a freshly created conversation, `clearUnread` on
 * conversation-open) so the UI doesn't wait on a refetch to reflect them.
 */

interface ChatState {
  status: ConnectionStatus;
  activePeerId: number | null;
  conversations: Conversation[];
  messagesByPeer: Record<number, ChatMessage[]>;
  unreadByPeer: Record<number, number>;
  /** Peer display names, captured from live traffic — falls back to REST `peerName` once `conversations` is populated. */
  peerNamesById: Record<number, string>;
}

const initialState: ChatState = {
  status: "idle",
  activePeerId: null,
  conversations: [],
  messagesByPeer: {},
  unreadByPeer: {},
  peerNamesById: {},
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setStatus(state, action: PayloadAction<ConnectionStatus>) {
      state.status = action.payload;
    },
    setActivePeer(state, action: PayloadAction<number | null>) {
      state.activePeerId = action.payload;
      if (action.payload !== null) {
        state.unreadByPeer[action.payload] = 0;
      }
    },
    /** Replaces the REST-hydrated conversation list wholesale (`chatApi.listConversations()` result). */
    setConversations(state, action: PayloadAction<Conversation[]>) {
      state.conversations = action.payload;
      for (const conversation of action.payload) {
        state.peerNamesById[conversation.peerId] = conversation.peerName;
      }
    },
    /**
     * Inserts or updates a single conversation row — used right after
     * `chatApi.createConversation()` resolves for a brand-new peer, so the
     * conversation list reflects it immediately instead of waiting on the
     * next `listConversations()` refetch.
     */
    upsertConversation(state, action: PayloadAction<Conversation>) {
      const conversation = action.payload;
      const index = state.conversations.findIndex((c) => c.peerId === conversation.peerId);
      if (index === -1) {
        state.conversations.unshift(conversation);
      } else {
        state.conversations[index] = { ...state.conversations[index], ...conversation };
      }
      state.peerNamesById[conversation.peerId] = conversation.peerName;
    },
    /** Replaces a peer's message history wholesale (`chatApi.listMessages()` result, ascending). */
    setMessages(state, action: PayloadAction<{ peerId: number; messages: ChatMessage[] }>) {
      state.messagesByPeer[action.payload.peerId] = action.payload.messages;
    },
    /** Sets a peer's unread count directly (e.g. from a REST list row), as opposed to the increment-on-receive of `messageReceived`. */
    setUnread(state, action: PayloadAction<{ peerId: number; count: number }>) {
      state.unreadByPeer[action.payload.peerId] = action.payload.count;
    },
    messageReceived(state, action: PayloadAction<ChatMessage>) {
      const message = action.payload;
      const peerId = message.senderId;
      if (!state.messagesByPeer[peerId]) {
        state.messagesByPeer[peerId] = [];
      }
      state.messagesByPeer[peerId].push(message);
      if (message.senderName) {
        state.peerNamesById[peerId] = message.senderName;
      }
      if (peerId !== state.activePeerId) {
        state.unreadByPeer[peerId] = (state.unreadByPeer[peerId] ?? 0) + 1;
      }
    },
    /**
     * Appends a message keyed by its `receiverId` (the peer). Used both for
     * the REST send result (has a real `id`) and for the optimistic
     * placeholder appended immediately on submit — see `messageReconciled`/
     * `messageSendFailed`, which settle that placeholder once the REST call
     * resolves or fails.
     */
    messageSent(state, action: PayloadAction<ChatMessage>) {
      const message = action.payload;
      const peerId = message.receiverId;
      if (!state.messagesByPeer[peerId]) {
        state.messagesByPeer[peerId] = [];
      }
      state.messagesByPeer[peerId].push(message);
    },
    /** Replaces the optimistic placeholder (matched by its temp `id`) with the real REST message once the send resolves. */
    messageReconciled(
      state,
      action: PayloadAction<{ peerId: number; tempId: number; message: ChatMessage }>,
    ) {
      const { peerId, tempId, message } = action.payload;
      const list = state.messagesByPeer[peerId];
      if (!list) {
        state.messagesByPeer[peerId] = [message];
        return;
      }
      const index = list.findIndex((m) => m.id === tempId);
      if (index === -1) {
        list.push(message);
      } else {
        list[index] = message;
      }
    },
    /** Removes the optimistic placeholder (matched by its temp `id`) after the REST send fails. */
    messageSendFailed(state, action: PayloadAction<{ peerId: number; tempId: number }>) {
      const { peerId, tempId } = action.payload;
      const list = state.messagesByPeer[peerId];
      if (!list) return;
      state.messagesByPeer[peerId] = list.filter((m) => m.id !== tempId);
    },
    /** Clears a peer's unread count locally — both the live counter and the matching conversation-list row's badge. */
    clearUnread(state, action: PayloadAction<number>) {
      const peerId = action.payload;
      state.unreadByPeer[peerId] = 0;
      const conversation = state.conversations.find((c) => c.peerId === peerId);
      if (conversation) conversation.unreadCount = 0;
    },
    resetChat() {
      return initialState;
    },
  },
});

export const {
  setStatus,
  setActivePeer,
  setConversations,
  upsertConversation,
  setMessages,
  setUnread,
  messageReceived,
  messageSent,
  messageReconciled,
  messageSendFailed,
  clearUnread,
  resetChat,
} = chatSlice.actions;

/** Slice of RootState holding this reducer, kept local to avoid importing @app/store here. */
interface ChatRootState {
  chat: ChatState;
}

const selectChatSlice = (state: ChatRootState): ChatState => state.chat;

export const selectChatStatus = (state: ChatRootState): ConnectionStatus => state.chat.status;

export const selectActivePeerId = (state: ChatRootState): number | null =>
  state.chat.activePeerId;

export const selectMessagesFor =
  (peerId: number) =>
  (state: ChatRootState): ChatMessage[] =>
    state.chat.messagesByPeer[peerId] ?? [];

export const selectTotalUnread = (state: ChatRootState): number =>
  Object.values(state.chat.unreadByPeer).reduce((sum, count) => sum + count, 0);

/** REST-hydrated conversation list, kept in sync with local optimistic writes — see `setConversations`/`upsertConversation`. Memoized to avoid a new-array identity on every unrelated slice update. */
export const selectConversations = createSelector(
  [selectChatSlice],
  (chat) => chat.conversations,
);

export default chatSlice.reducer;
