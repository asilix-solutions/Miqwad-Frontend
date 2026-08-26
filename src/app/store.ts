import { configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import authReducer from "@modules/auth/store/authSlice";
import vehiclesReducer from "@modules/vehicles/store/vehiclesSlice";
import providersReducer from "@modules/providers/store/providersSlice";
import discoveryReducer from "@modules/discovery/store/discoverySlice";
import chatReducer from "@modules/chat/store/chatSlice";

/**
 * Root Redux store.
 * Slices are registered here; each feature module owns its own slice file.
 */
export const store = configureStore({
  reducer: {
    auth: authReducer,
    vehicles: vehiclesReducer,
    providers: providersReducer,
    discovery: discoveryReducer,
    chat: chatReducer,
  },
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

/** Pre-typed hooks — always use these instead of the raw ones. */
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
