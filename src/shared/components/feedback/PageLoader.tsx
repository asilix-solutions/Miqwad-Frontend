/**
 * @file PageLoader.tsx
 *
 * Full-page loading spinner component designed to serve as the fallback for
 * React's `<Suspense>` boundary at the route/page level.
 *
 * Displays a centered spinner with subtle Arabic loading text ("جاري التحميل...")
 * against the app's background color. Fully RTL-friendly and built with
 * design system tokens.
 *
 * Architecture location: `src/shared/components/feedback/`
 * Usage: `<Suspense fallback={<PageLoader />}>` (wired in a later step)
 */

import { Spinner } from "@shared/components/ui/spinner";

// ---------------------------------------------------------------------------
// Props Interface
// ---------------------------------------------------------------------------

/**
 * Props accepted by the `PageLoader` component.
 *
 * @property message - Optional override for the loading text.
 *                     Defaults to "جاري التحميل..." (Arabic for "Loading...").
 */
export interface PageLoaderProps {
  message?: string;
}

/** Default Arabic loading text used when no custom message is provided. */
const DEFAULT_LOADING_MESSAGE = "جاري التحميل...";

// ---------------------------------------------------------------------------
// PageLoader Component
// ---------------------------------------------------------------------------

/**
 * A full-viewport loading screen intended as the `<Suspense>` fallback
 * for lazy-loaded routes. Centers a branded spinner with a subtle text
 * label on the app's background surface.
 *
 * @example
 * ```tsx
 * import { Suspense, lazy } from "react";
 * import { PageLoader } from "@shared/components/feedback/PageLoader";
 *
 * const Dashboard = lazy(() => import("@modules/dashboard/pages/DashboardPage"));
 *
 * <Suspense fallback={<PageLoader />}>
 *   <Dashboard />
 * </Suspense>
 * ```
 */
export function PageLoader({ message }: PageLoaderProps) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-4 bg-ink-50"
      dir="rtl"
      role="status"
      aria-live="polite"
    >
      {/* Spinner from the shared UI library */}
      <Spinner size="lg" className="border-ink-200 border-t-brand-500" />

      {/* Loading text */}
      <p className="font-body text-sm font-medium text-ink-400 animate-pulse">
        {message ?? DEFAULT_LOADING_MESSAGE}
      </p>
    </div>
  );
}

// Default export for flexible import patterns
export default PageLoader;
