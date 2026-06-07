import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { logout } from "@modules/auth/store/authSlice";
import type {
  ProviderCompanyValues,
  ProviderLocationValues,
} from "../schemas/providers.schemas";
import type { ProviderDocument } from "../types";

/**
 * Sprint 3 providers slice.
 *
 * Like Sprint 2 we keep *server* state in TanStack Query and only
 * persist the UI bits that need to survive route changes:
 *
 *   - registerDraft: the multi-step form values built across the
 *     ProviderRegister stepper. Lets the user navigate back to a
 *     previous step without losing what they typed.
 *
 *   - currentStep: which step of the stepper is active.
 *
 *   - servicesFilter / adminFilter: small filters persisted so users
 *     keep their search/status preference when navigating away.
 *
 * Reset to initialState on logout (extraReducers).
 */

export interface ProviderRegisterDraft {
  company: Partial<ProviderCompanyValues>;
  location: Partial<ProviderLocationValues>;
  categoryIds: number[];
  documents: ProviderDocument[];
}

const emptyDraft: ProviderRegisterDraft = {
  company: {},
  location: {},
  categoryIds: [],
  documents: [],
};

interface ProvidersState {
  registerDraft: ProviderRegisterDraft;
  currentStep: number;
  servicesSearch: string;
  adminStatus: "pending" | "approved" | "rejected" | "all";
}

const initialState: ProvidersState = {
  registerDraft: emptyDraft,
  currentStep: 0,
  servicesSearch: "",
  adminStatus: "pending",
};

const providersSlice = createSlice({
  name: "providers",
  initialState,
  reducers: {
    setRegisterStep(state, action: PayloadAction<number>) {
      state.currentStep = Math.max(0, action.payload);
    },
    patchCompany(state, action: PayloadAction<Partial<ProviderCompanyValues>>) {
      state.registerDraft.company = { ...state.registerDraft.company, ...action.payload };
    },
    patchLocation(state, action: PayloadAction<Partial<ProviderLocationValues>>) {
      state.registerDraft.location = { ...state.registerDraft.location, ...action.payload };
    },
    setDraftCategories(state, action: PayloadAction<number[]>) {
      state.registerDraft.categoryIds = action.payload;
    },
    setDraftDocuments(state, action: PayloadAction<ProviderDocument[]>) {
      state.registerDraft.documents = action.payload;
    },
    resetRegisterDraft(state) {
      state.registerDraft = emptyDraft;
      state.currentStep = 0;
    },
    setServicesSearch(state, action: PayloadAction<string>) {
      state.servicesSearch = action.payload;
    },
    setAdminStatus(state, action: PayloadAction<ProvidersState["adminStatus"]>) {
      state.adminStatus = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(logout, () => initialState);
  },
});

export const {
  setRegisterStep,
  patchCompany,
  patchLocation,
  setDraftCategories,
  setDraftDocuments,
  resetRegisterDraft,
  setServicesSearch,
  setAdminStatus,
} = providersSlice.actions;

export default providersSlice.reducer;
