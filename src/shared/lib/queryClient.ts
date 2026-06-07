import { QueryClient } from "@tanstack/react-query";

/**
 * Single QueryClient instance.
 * Tuned defaults for an MVP:
 *   - 60s staleTime: fewer refetches while users browse between pages.
 *   - retry x1: avoid hammering the API on flaky connections.
 *   - refetchOnWindowFocus disabled: noisy in dashboards.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
