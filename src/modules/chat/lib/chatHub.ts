/**
 * SignalR chat hub transport layer. This is the ONLY file in the codebase
 * that imports @microsoft/signalr — pure transport, no React, no Redux.
 * Consumers get a typed, framework-agnostic API via `chatHubManager`.
 *
 * RECEIVE-ONLY as of the REST cutover (see ../api/chatApi.ts): the hub is
 * for live inbound delivery (`ReceiveMessage` → `onMessage`) only. Sending
 * goes through `chatApi.sendMessage`/`createConversation`, which return a
 * real message id the hub invoke never did — this manager has no send
 * method any more.
 */
import {
  HttpTransportType,
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { storage, StorageKeys } from "@shared/lib/storage";
import type { ChatMessage } from "../types";

/**
 * Hub origin resolution, in priority order:
 *   1. VITE_CHAT_HUB_URL — dedicated override, set it if the hub ever lives
 *      on a different host than the REST API.
 *   2. VITE_API_BASE_URL with a trailing "/api" stripped — that env always
 *      carries the "/api" REST prefix (see .env.example), which the hub path
 *      must NOT inherit, and in local dev it may be the relative "/api" (Vite
 *      proxy) which cannot host a raw WebSocket — so it's only used when
 *      absolute.
 *   3. The confirmed test host, as a hardcoded fallback.
 */
const apiBase = import.meta.env.VITE_API_BASE_URL;
const apiOrigin = apiBase?.startsWith("http") ? apiBase.replace(/\/api\/?$/, "") : undefined;

export const CHAT_HUB_URL = `${
  import.meta.env.VITE_CHAT_HUB_URL ?? apiOrigin ?? "https://miqwad-test.runasp.net"
}/hubs/chat`;

type MessageHandler = (message: ChatMessage) => void;
type VoidHandler = () => void;
type Unsubscribe = () => void;

// TODO: backend — guide claims skipNegotiation:true is supported, but the live
// runasp.net host rejects it: WebSocket fails with "connection ID is not present
// on the server", because skipping negotiation skips the step that mints the
// server-side connectionId, and the runasp.net proxy/load-balancer needs it.
// Left false until the backend confirms skipNegotiation works behind that proxy.
const SKIP_NEGOTIATION = false;

/**
 * Manages a single, lazily-created SignalR HubConnection to the chat hub.
 * Idempotent connect/disconnect; guards against creating duplicate connections.
 */
class ChatHubManager {
  private connection: HubConnection | null = null;

  // Tracks an in-flight connection.start() so a StrictMode double-mount (or
  // any other overlapping caller) shares one start instead of racing a
  // second start() or a disconnect() against a start still awaiting negotiate.
  private startPromise: Promise<void> | null = null;

  // Fan-out sets for consumer-facing callbacks. The manager wires exactly ONE
  // listener per signalR event onto the underlying connection (in
  // getConnection(), when the connection is built) and fans it out to these
  // sets. This is what makes onMessage/onReconnecting/onReconnected/onClosed
  // safe to call from a React effect that may run twice (StrictMode
  // mount→unmount→mount) without registering duplicate signalR-level
  // handlers — each React mount adds/removes its own callback from the set
  // instead of calling connection.on(...)/onreconnecting(...) again.
  private readonly messageListeners = new Set<MessageHandler>();
  private readonly reconnectingListeners = new Set<VoidHandler>();
  private readonly reconnectedListeners = new Set<VoidHandler>();
  private readonly closedListeners = new Set<VoidHandler>();

  private getConnection(): HubConnection {
    if (!this.connection) {
      const connection = new HubConnectionBuilder()
        .withUrl(CHAT_HUB_URL, {
          accessTokenFactory: () => storage.get<string>(StorageKeys.accessToken) ?? "",
          ...(SKIP_NEGOTIATION
            ? { skipNegotiation: true, transport: HttpTransportType.WebSockets }
            : {}),
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(LogLevel.Information)
        .build();

      connection.on("ReceiveMessage", (message: ChatMessage) => {
        this.messageListeners.forEach((cb) => cb(message));
      });
      connection.onreconnecting(() => {
        this.reconnectingListeners.forEach((cb) => cb());
      });
      connection.onreconnected(() => {
        this.reconnectedListeners.forEach((cb) => cb());
      });
      connection.onclose(() => {
        this.closedListeners.forEach((cb) => cb());
      });

      this.connection = connection;
    }
    return this.connection;
  }

  async connect(): Promise<void> {
    const connection = this.getConnection();
    if (connection.state === HubConnectionState.Connected) return;
    if (this.startPromise) return this.startPromise;

    this.startPromise = connection.start().finally(() => {
      this.startPromise = null;
    });
    return this.startPromise;
  }

  async disconnect(): Promise<void> {
    if (!this.connection) return;

    // Never stop() a connection whose start() is still awaiting negotiate —
    // that is what produced "The connection was stopped during negotiation".
    // Wait for the in-flight start to settle (ignore its outcome) first.
    if (this.startPromise) {
      try {
        await this.startPromise;
      } catch {
        // start() failed on its own; nothing to stop.
      }
    }

    if (this.connection.state !== HubConnectionState.Disconnected) {
      await this.connection.stop();
    }

    // Rebuild on next connect() rather than reusing a stopped instance —
    // safest across @microsoft/signalr versions, some of which forbid
    // restarting a HubConnection once stopped.
    this.connection = null;

    // A fresh connection will be wired up from scratch on next connect();
    // drop any listeners left over from the torn-down session (logout path).
    this.messageListeners.clear();
    this.reconnectingListeners.clear();
    this.reconnectedListeners.clear();
    this.closedListeners.clear();
  }

  onMessage(cb: MessageHandler): Unsubscribe {
    this.getConnection(); // ensure the connection (and its fan-out wiring) exists
    this.messageListeners.add(cb);
    return () => this.messageListeners.delete(cb);
  }

  onReconnecting(cb: VoidHandler): Unsubscribe {
    this.getConnection();
    this.reconnectingListeners.add(cb);
    return () => this.reconnectingListeners.delete(cb);
  }

  onReconnected(cb: VoidHandler): Unsubscribe {
    this.getConnection();
    this.reconnectedListeners.add(cb);
    return () => this.reconnectedListeners.delete(cb);
  }

  onClosed(cb: VoidHandler): Unsubscribe {
    this.getConnection();
    this.closedListeners.add(cb);
    return () => this.closedListeners.delete(cb);
  }

  /** Live signalR connection state — never a stale promise resolution. */
  getState(): HubConnectionState {
    return this.connection?.state ?? HubConnectionState.Disconnected;
  }

  /** Convenience check for the live state, used to gate "connected" dispatches. */
  isConnected(): boolean {
    return this.getState() === HubConnectionState.Connected;
  }
}

export const chatHubManager = new ChatHubManager();
