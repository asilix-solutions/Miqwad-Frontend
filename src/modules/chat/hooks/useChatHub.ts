import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAppDispatch, useAppSelector } from "@app/store";
import { chatHubManager } from "../lib/chatHub";
import { mapHubMessage, mergeReceivedMessage, upsertMessage } from "../lib/chatAdapter";
import { selectChatStatus, setStatus } from "../store/chatSlice";
import { chatKeys } from "./useChatHistory";
import type { ChatMessage, ConversationDetail } from "../types";

let connectGeneration = 0;
export function useChatHub(userId: number, visible: boolean, conversationId: number | null) {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const status = useAppSelector(selectChatStatus);
  // This hook is remounted with the user session; IDs never cross accounts.
  const deletedIds = useRef(new Set<number>());
  const confirmDeleted = useCallback((id: number) => {
    deletedIds.current.add(id);
  }, []);
  const reconcileMessage = useCallback((messages: ChatMessage[], message: ChatMessage) => {
    // A late edit/send response must not undo a subsequently confirmed deletion.
    return upsertMessage(messages, message, deletedIds.current);
  }, []);
  useEffect(() => {
    if (userId <= 0) return;
    let mounted = true;
    const refresh = () => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.lists(userId) });
      void queryClient.invalidateQueries({ queryKey: chatKeys.unread(userId) });
    };
    const unsubscribe = chatHubManager.onMessage((raw) => {
      const message = mapHubMessage(raw);
      if (!message) {
        refresh();
        if (visible && conversationId !== null)
          void queryClient.invalidateQueries({
            queryKey: chatKeys.messages(userId, conversationId),
          });
        return;
      }
      if (message.senderId !== userId && message.receiverId !== userId) return;
      const id = message.conversationId;
      if (id !== undefined) {
        // Cancel a stale in-flight snapshot before merging the newer event.
        // An unopened thread must never be fetched: detail GET marks it read.
        const key = chatKeys.messages(userId, id);
        if (queryClient.getQueryData(key) || (visible && id === conversationId)) {
          void queryClient.cancelQueries({ queryKey: key }).then(() => {
            if (!mounted) return;
            const existing = queryClient.getQueryData<ConversationDetail>(key);
            if (existing) {
              queryClient.setQueryData<ConversationDetail>(key, (old) =>
                old
                  ? {
                      ...old,
                      messages: mergeReceivedMessage(old.messages, message, deletedIds.current),
                    }
                  : undefined,
              );
            } else if (visible && id === conversationId) {
              void queryClient.invalidateQueries({ queryKey: key });
            }
          });
        }
      }
      refresh();
    });
    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [userId, queryClient, visible, conversationId]);
  useEffect(() => {
    if (userId <= 0) return;
    const generation = ++connectGeneration;
    const reconnecting = chatHubManager.onReconnecting(() => dispatch(setStatus("reconnecting")));
    const reconnected = chatHubManager.onReconnected(() => {
      dispatch(setStatus("connected"));
      // Only enabled/observed history is refetched; unopened threads remain unread.
      void queryClient.invalidateQueries({ queryKey: chatKeys.all(userId) });
    });
    const closed = chatHubManager.onClosed(() => dispatch(setStatus("disconnected")));
    dispatch(setStatus("connecting"));
    void chatHubManager
      .connect()
      .then(() => {
        if (generation === connectGeneration && chatHubManager.isConnected()) {
          dispatch(setStatus("connected"));
          void queryClient.invalidateQueries({ queryKey: chatKeys.all(userId) });
        }
      })
      .catch(() => {
        if (generation === connectGeneration) dispatch(setStatus("disconnected"));
      });
    return () => {
      if (generation === connectGeneration) connectGeneration += 1;
      // Auth owns the singleton connection; screen cleanup removes only its listeners.
      reconnecting();
      reconnected();
      closed();
    };
  }, [dispatch, queryClient, userId]);
  return { status, confirmDeleted, reconcileMessage };
}
