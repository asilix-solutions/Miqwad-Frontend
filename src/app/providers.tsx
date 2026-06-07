/**
 * @file providers.tsx
 *
 * Composition root for all cross-cutting providers in the Maqwad application.
 * This file establishes the global context hierarchy that every component in
 * the app has access to.
 *
 * Architecture location: `src/app/`
 * Entry flow: main.tsx → App.tsx → AppProviders → RouterProvider
 */

import type { ReactNode } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { I18nextProvider } from "react-i18next";
import { store } from "./store";
import { queryClient } from "@shared/lib/queryClient";
import { ToastProvider } from "@shared/components/ui/toast";
import { QueryAwareErrorBoundary } from "@shared/components/error/ErrorBoundary";
import i18n from "./i18n";

/**
 * Root provider composition that wraps the entire application.
 *
 * ### Provider stack order (outermost → innermost):
 *
 * 1. **ReduxProvider** — Global UI state (auth flags, sidebar state, etc.).
 *    Must be outermost so any provider below can dispatch or select state.
 *
 * 2. **QueryClientProvider** — TanStack Query client for server-state caching.
 *    Sits above I18n so that query error messages can be translated.
 *
 * 3. **I18nextProvider** — Internationalization context (Arabic-first, RTL).
 *    Above Toast so toast messages render in the active language.
 *
 * 4. **ToastProvider** (Radix) — Application-wide toast notifications.
 *    Uses both Redux and i18n, so must sit below them.
 *
 * 5. **QueryAwareErrorBoundary** — Catches render-time errors and integrates
 *    with TanStack Query's `QueryErrorResetBoundary` to clear stale cache
 *    on user-initiated retry. Wraps `RouterProvider` so that any route-level
 *    crash is caught and recoverable without losing global provider context.
 *
 * 6. **RouterProvider** _(passed as `children`)_ — React Router DOM v7 router.
 *
 * @remarks
 * Order matters: providers higher in the tree are available to all providers
 * and components below. Reordering can cause hydration bugs, missing context
 * errors, or broken error recovery flows.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <ToastProvider>
            <QueryAwareErrorBoundary>
              {children}
            </QueryAwareErrorBoundary>
          </ToastProvider>
        </I18nextProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}
