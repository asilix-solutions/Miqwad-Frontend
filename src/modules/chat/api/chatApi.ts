import { z } from "zod";
import { apiClient } from "@shared/lib/axios";
import {
  attachmentSchema,
  mapConversationPage,
  mapDetail,
  mapMessage,
  parseContract,
  unwrapChat,
} from "../lib/chatAdapter";
import type { MessageInput } from "../types";

// Prevent the shared 401 interceptor from replaying mutations. Query mutations never auto-retry.
const mutationConfig = { _retry: true, timeout: 20_000 };
export const chatApi = {
  async listConversations(page = 1, signal?: AbortSignal) {
    const { data } = await apiClient.get<unknown>("/Conversations", {
      params: { PageNumber: page, PageSize: 20 },
      signal,
    });
    return mapConversationPage(unwrapChat(data));
  },
  async getConversation(id: number, signal?: AbortSignal) {
    // Live GET marks incoming messages read: call only for a visible, selected conversation.
    const { data } = await apiClient.get<unknown>(`/Conversations/${id}`, { signal });
    return mapDetail(unwrapChat(data));
  },
  async createConversation(input: MessageInput & { receiverId: number }) {
    const { data } = await apiClient.post<unknown>("/Conversations", input, mutationConfig);
    return mapDetail(unwrapChat(data));
  },
  async sendMessage(id: number, input: MessageInput) {
    const { data } = await apiClient.post<unknown>(
      `/Conversations/${id}/messages`,
      input,
      mutationConfig,
    );
    return mapMessage(unwrapChat(data), id);
  },
  async getMessage(id: number) {
    const { data } = await apiClient.get<unknown>(`/Conversations/messages/${id}`);
    return mapMessage(unwrapChat(data));
  },
  async editMessage(id: number, message: string) {
    const { data } = await apiClient.put<unknown>(
      `/Conversations/messages/${id}`,
      { message },
      mutationConfig,
    );
    return mapMessage(unwrapChat(data));
  },
  async deleteMessage(id: number) {
    const { data } = await apiClient.delete<unknown>(
      `/Conversations/messages/${id}`,
      mutationConfig,
    );
    unwrapChat(data);
  },
  async getUnreadCount(signal?: AbortSignal) {
    const { data } = await apiClient.get<unknown>("/Conversations/unread-count", { signal });
    return parseContract(
      z.object({ unreadCount: z.number().int().nonnegative() }),
      unwrapChat(data),
    ).unreadCount;
  },
  async markRead(id: number) {
    const { data } = await apiClient.put<unknown>(
      `/Conversations/${id}/read`,
      undefined,
      mutationConfig,
    );
    unwrapChat(data);
  },
  async uploadMedia(file: File, onProgress: (percent: number) => void) {
    const form = new FormData();
    form.append("File", file);
    const { data } = await apiClient.post<unknown>("/Conversations/media", form, {
      ...mutationConfig,
      headers: { "Content-Type": undefined },
      timeout: 120_000,
      onUploadProgress: (event) => {
        if (event.total) onProgress(Math.round((event.loaded / event.total) * 100));
      },
    });
    return parseContract(attachmentSchema, unwrapChat(data));
  },
};
