/**
 * React bridge between the SignalR chat hub transport and Redux chat state.
 * Owns the connection lifecycle for as long as the consuming component is
 * mounted. Receive-only as of the REST cutover — inbound `ReceiveMessage`
 * events are dispatched into Redux here, but sending goes through
 * `chatApi` (see ChatScreen.tsx), not this hub. No JSX here.
 */
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@app/store";
import { chatHubManager } from "../lib/chatHub";
import { messageReceived, selectChatStatus, setStatus } from "../store/chatSlice";
import type { ConnectionStatus } from "../types";

interface UseChatHubResult {
  status: ConnectionStatus;
}

// Module-level counter (not component-scoped) so that a late resolution from
// an EARLIER useChatHub mount (e.g. a StrictMode double-mount, or a fast
// unmount/remount across a route change) can never win over a dispatch made
// by a later mount — each effect run captures the generation current at its
// start, and only the run that still owns the latest generation may dispatch
// "connected" from its connect().then().
let connectGeneration = 0;

export function useChatHub(): UseChatHubResult {
  const dispatch = useAppDispatch();
  const status = useAppSelector(selectChatStatus);

  useEffect(() => {
    const generation = ++connectGeneration;

    const unsubscribeMessage = chatHubManager.onMessage((message) => {
      dispatch(messageReceived(message));
    });
    const unsubscribeReconnecting = chatHubManager.onReconnecting(() =>
      dispatch(setStatus("reconnecting")),
    );
    const unsubscribeReconnected = chatHubManager.onReconnected(() =>
      dispatch(setStatus("connected")),
    );
    const unsubscribeClosed = chatHubManager.onClosed(() => dispatch(setStatus("disconnected")));

    dispatch(setStatus("connecting"));
    chatHubManager
      .connect()
      .then(() => {
        // Only dispatch "connected" if this is still the latest connect
        // attempt AND the hub is still actually connected right now — a
        // resolved start() promise does not mean the connection is still
        // open; onClosed may have already fired (and dispatched
        // "disconnected") by the time this .then() runs, and that live
        // signal must win, not this stale promise resolution.
        if (generation === connectGeneration && chatHubManager.isConnected()) {
          dispatch(setStatus("connected"));
        }
      })
      .catch(() => {
        if (generation === connectGeneration) dispatch(setStatus("disconnected"));
      });

    // Deliberately do NOT disconnect the hub here. The hub is an app-level
    // singleton whose lifetime is owned at app/auth scope (torn down only on
    // logout, see useLogout.ts), not at screen scope — a screen unmount, a
    // route change, or React StrictMode's mount→unmount→mount must not kill
    // a connection that's still needed. Only unsubscribe this effect's own
    // listeners so a remount doesn't stack duplicate dispatches.
    return () => {
      unsubscribeMessage();
      unsubscribeReconnecting();
      unsubscribeReconnected();
      unsubscribeClosed();
    };
  }, [dispatch]);

  return { status };
}
