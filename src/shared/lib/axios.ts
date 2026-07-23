import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { AppError } from "@shared/types/api";
import { storage, StorageKeys } from "./storage";

/**
 * Axios instance + interceptors.
 *
 *  Request flow:
 *   1. Attach Authorization: Bearer <accessToken> if present.
 *   2. Attach Accept-Language from current i18n preference.
 *
 *  Response flow:
 *   1. On 401: try to refresh once, retry the original request.
 *   2. On failure: normalise into AppError so callers always
 *      receive a predictable shape.
 *
 *  The refresh endpoint is decoupled (no interceptor recursion).
 */

// Fallback is the absolute production URL (production truth). A local .env
// may temporarily override this to "/api" to route through the Vite dev
// proxy while the backend lacks CORS — see vite.config.ts.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://miqwad-test.runasp.net/api";

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Bare axios used only by the refresh call to avoid recursive interception.
 */
const refreshClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20_000,
  headers: { "Content-Type": "application/json" },
});

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

// ---- Request interceptor ---------------------------------------------------
apiClient.interceptors.request.use((config) => {
  const token = storage.get<string>(StorageKeys.accessToken);
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  const lang = storage.get<string>(StorageKeys.language) ?? "ar";
  config.headers.set("Accept-Language", lang);
  return config;
});

// ---- Refresh-token coordination -------------------------------------------
// Multiple concurrent 401s share the same refresh attempt.
let refreshInflight: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshInflight) return refreshInflight;

  refreshInflight = (async () => {
    const refreshToken = storage.get<string>(StorageKeys.refreshToken);
    if (!refreshToken) throw new AppError("Missing refresh token", "AUTH_REFRESH_MISSING", 401);

    const { data } = await refreshClient.post<{ accessToken: string; refreshToken: string }>(
      "/auth/refresh-token",
      { refreshToken },
    );
    storage.set(StorageKeys.accessToken, data.accessToken);
    storage.set(StorageKeys.refreshToken, data.refreshToken);
    return data.accessToken;
  })();

  try {
    return await refreshInflight;
  } finally {
    refreshInflight = null;
  }
}

// ---- Response interceptor --------------------------------------------------
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ code?: string; message?: string; fields?: Record<string, string[]> }>) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    // 401 → try to refresh once, then retry original request.
    if (status === 401 && original && !original._retry && !original.url?.includes("/auth/")) {
      original._retry = true;

      // Backend gap: the real API has no /auth/refresh-token endpoint yet
      // (single ~60min access token, no refresh). Without a stored
      // refreshToken there is nothing to attempt — skip straight to
      // clearing the session instead of calling an endpoint that doesn't
      // exist. Remove this guard once refresh is added for providers/admins.
      const refreshToken = storage.get<string>(StorageKeys.refreshToken);
      if (!refreshToken) {
        storage.clearAuth();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.assign("/login");
        }
        return Promise.reject(normaliseError(error));
      }

      try {
        const newToken = await refreshAccessToken();
        original.headers.set?.("Authorization", `Bearer ${newToken}`);
        return apiClient(original);
      } catch (refreshError) {
        storage.clearAuth();
        // Hard redirect: cheaper than wiring router into HTTP layer.
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.assign("/login");
        }
        return Promise.reject(normaliseError(refreshError));
      }
    }

    return Promise.reject(normaliseError(error));
  },
);

/**
 * Convert axios / network errors into a stable AppError.
 * Anything thrown from API calls in the app will be an AppError.
 */
function normaliseError(error: unknown): AppError {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as
      | { code?: string; message?: string; fields?: Record<string, string[]> }
      | undefined;
    const message = payload?.message || error.message || "حدث خطأ غير متوقع";
    const code = payload?.code || error.code || "NETWORK_ERROR";
    return new AppError(message, code, error.response?.status, payload?.fields);
  }
  if (error instanceof AppError) return error;
  if (error instanceof Error) return new AppError(error.message);
  return new AppError("حدث خطأ غير متوقع");
}
