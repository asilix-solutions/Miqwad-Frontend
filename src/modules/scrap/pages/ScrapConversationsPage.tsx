/**
 * @file ScrapConversationsPage.tsx
 *
 * Scrap provider conversations entry point — renders the shared
 * ChatScreen (live SignalR hub; see CHAT_SOURCE / CHAT_HUB_URL).
 */

import { ChatScreen } from "@modules/chat/components/ChatScreen";

export function ScrapConversationsPage() {
  return <ChatScreen role="scrap" />;
}
