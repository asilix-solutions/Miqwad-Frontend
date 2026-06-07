import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { storage, StorageKeys } from "@shared/lib/storage";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  /** Set after register() so OTP page can finish the flow. */
  pendingVerification: {
    verificationId: string;
    phoneNumber: string;
    resendAfter: number;
  } | null;
  status: "idle" | "loading" | "authenticated" | "error";
}

const initialState: AuthState = {
  user: storage.get<User>(StorageKeys.user),
  accessToken: storage.get<string>(StorageKeys.accessToken),
  refreshToken: storage.get<string>(StorageKeys.refreshToken),
  pendingVerification: null,
  status: storage.get<string>(StorageKeys.accessToken) ? "authenticated" : "idle",
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setPendingVerification(
      state,
      action: PayloadAction<NonNullable<AuthState["pendingVerification"]>>,
    ) {
      state.pendingVerification = action.payload;
    },
    clearPendingVerification(state) {
      state.pendingVerification = null;
    },
    setCredentials(
      state,
      action: PayloadAction<{ user: User; accessToken: string; refreshToken: string }>,
    ) {
      const { user, accessToken, refreshToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      state.status = "authenticated";
      state.pendingVerification = null;
      storage.set(StorageKeys.accessToken, accessToken);
      storage.set(StorageKeys.refreshToken, refreshToken);
      storage.set(StorageKeys.user, user);
    },
    setUser(state, action: PayloadAction<User>) {
      state.user = action.payload;
      storage.set(StorageKeys.user, action.payload);
    },
    logout(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.status = "idle";
      state.pendingVerification = null;
      storage.clearAuth();
    },
  },
});

export const { setPendingVerification, clearPendingVerification, setCredentials, setUser, logout } =
  authSlice.actions;
export default authSlice.reducer;
