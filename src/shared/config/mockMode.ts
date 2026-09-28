/** One explicit, development-only mock switch shared by transport and UI. */
export function resolveMockMode(env: {
  DEV: boolean;
  VITE_ENABLE_MOCKS?: string;
  VITE_USE_MOCKS?: string;
}): boolean {
  // The new flag takes precedence, including an explicit false. Keep the
  // historical flag as a compatibility alias for existing local setups.
  return env.DEV && (env.VITE_ENABLE_MOCKS ?? env.VITE_USE_MOCKS) === "true";
}

export const mockModeEnabled = resolveMockMode(import.meta.env);
