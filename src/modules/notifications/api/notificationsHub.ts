/**
 * SignalR notifications hub transport layer. Mirrors
 * ../../chat/lib/chatHub.ts — the ONLY file here that imports
 * @microsoft/signalr — pure transport, no React, no Redux. Consumers get a
 * typed, framework-agnostic API via `notificationsHubManager`.
 *
 * GROUND TRUTH: the backend broadcasts a single confirmed event,
 * "TestNotification" (payload `{ type, title, message, sentAt }`), fired via
 * POST /api/notifications/test-broadcast. It is a global broadcast — no
 * per-user targeting, no id, no isRead. There is no persisted notifications
 * REST API yet (see ../types.ts).
 */
import {
  HttpTransportType,
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { storage, StorageKeys } from "@shared/lib/storage";

/** Raw wire payload of the "TestNotification" hub event. */
export interface TestNotificationPayload {
  type: string;
  title: string;
  message: string;
  sentAt: string;
}

/**
 * Hub origin resolution, in priority order — identical strategy to
 * ../../chat/lib/chatHub.ts (CHAT_HUB_URL), applied to the notifications hub
 * instead of the chat hub:
 *   1. VITE_NOTIFICATIONS_HUB_URL — dedicated override.
 *   2. VITE_API_BASE_URL with a trailing "/api" stripped, when absolute.
 *   3. The confirmed test host, as a hardcoded fallback.
 */
const apiBase = import.meta.env.VITE_API_BASE_URL;
const apiOrigin = apiBase?.startsWith("http") ? apiBase.replace(/\/api\/?$/, "") : undefined;

export const NOTIFICATIONS_HUB_URL = `${
  import.meta.env.VITE_NOTIFICATIONS_HUB_URL ?? apiOrigin ?? "https://miqwad-test.runasp.net"
}/hubs/notifications`;

/** Source switch, same spirit as chat's CHAT_SOURCE — only "live" exists today. */
export const NOTIFICATIONS_SOURCE = "live" as const;

type NotificationHandler = (payload: TestNotificationPayload) => void;
type VoidHandler = () => void;
type Unsubscribe = () => void;

// Left false for the same reason as chatHub.ts: the live runasp.net host
// rejects skipNegotiation behind its proxy/load-balancer.
const SKIP_NEGOTIATION = false;

/**
 * Manages a single, lazily-created SignalR HubConnection to the
 * notifications hub. Idempotent connect/disconnect; guards against creating
 * duplicate connections.
 */
class NotificationsHubManager {
  private connection: HubConnection | null = null;

  // See chatHub.ts's ChatHubManager.startPromise for the rationale — shares
  // one in-flight start() across overlapping callers (e.g. StrictMode).
  private startPromise: Promise<void> | null = null;

  private readonly notificationListeners = new Set<NotificationHandler>();
  private readonly reconnectingListeners = new Set<VoidHandler>();
  private readonly reconnectedListeners = new Set<VoidHandler>();
  private readonly closedListeners = new Set<VoidHandler>();

  private getConnection(): HubConnection {
    if (!this.connection) {
      const connection = new HubConnectionBuilder()
        .withUrl(NOTIFICATIONS_HUB_URL, {
          accessTokenFactory: () => storage.get<string>(StorageKeys.accessToken) ?? "",
          ...(SKIP_NEGOTIATION
            ? { skipNegotiation: true, transport: HttpTransportType.WebSockets }
            : {}),
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
        .configureLogging(LogLevel.Information)
        .build();

      connection.on("TestNotification", (payload: TestNotificationPayload) => {
        this.notificationListeners.forEach((cb) => cb(payload));
      });
      // TODO: also subscribe to the real "ReceiveNotification" event once
      // the backend ships it — same handler / same fan-out set, since the
      // consumer-facing shape (NotificationItem) is identical either way.

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

    // Rebuild on next connect() rather than reusing a stopped instance.
    this.connection = null;

    this.notificationListeners.clear();
    this.reconnectingListeners.clear();
    this.reconnectedListeners.clear();
    this.closedListeners.clear();
  }

  onNotification(cb: NotificationHandler): Unsubscribe {
    this.getConnection();
    this.notificationListeners.add(cb);
    return () => this.notificationListeners.delete(cb);
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

  isConnected(): boolean {
    return this.getState() === HubConnectionState.Connected;
  }
}

export const notificationsHubManager = new NotificationsHubManager();
