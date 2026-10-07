import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ConnectionStatus } from "../types";

// Redux retains connection state only. Server conversations/messages live in TanStack Query.
interface ChatState {
  status: ConnectionStatus;
}
const initialState: ChatState = { status: "idle" };
const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    setStatus(state, action: PayloadAction<ConnectionStatus>) {
      state.status = action.payload;
    },
    resetChat() {
      return initialState;
    },
  },
});
export const { setStatus, resetChat } = chatSlice.actions;
export const selectChatStatus = (state: { chat: ChatState }) => state.chat.status;
export default chatSlice.reducer;
