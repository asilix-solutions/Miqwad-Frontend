/**
 * @file WorkshopConversationsPage.tsx
 *
 * Workshop provider conversations entry point — renders the shared
 * ChatScreen (live SignalR hub; see CHAT_SOURCE / CHAT_HUB_URL).
 */

import { ChatScreen } from "@modules/chat/components/ChatScreen";

export function WorkshopConversationsPage() {
  return <ChatScreen role="workshop" />;
}
