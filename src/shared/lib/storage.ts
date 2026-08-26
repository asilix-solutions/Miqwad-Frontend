/**
 * Type-safe localStorage wrapper.
 * Centralises all storage keys to avoid drift between modules.
 * Keep this thin: business logic belongs in slices/hooks.
 */

const PREFIX = "maqwad.";

export const StorageKeys = {
  accessToken: `${PREFIX}accessToken`,
  refreshToken: `${PREFIX}refreshToken`,
  language: `${PREFIX}language`,
  user: `${PREFIX}user`,
  notificationsMuted: `${PREFIX}notificationsMuted`,
} as const;

export type StorageKey = (typeof StorageKeys)[keyof typeof StorageKeys];

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export const storage = {
  get<T = string>(key: StorageKey): T | null {
    if (!isBrowser()) return null;
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  },

  set<T>(key: StorageKey, value: T): void {
    if (!isBrowser()) return;
    const payload = typeof value === "string" ? value : JSON.stringify(value);
    window.localStorage.setItem(key, payload);
  },

  remove(key: StorageKey): void {
    if (!isBrowser()) return;
    window.localStorage.removeItem(key);
  },

  clearAuth(): void {
    if (!isBrowser()) return;
    window.localStorage.removeItem(StorageKeys.accessToken);
    window.localStorage.removeItem(StorageKeys.refreshToken);
    window.localStorage.removeItem(StorageKeys.user);
  },
};
