/**
 * @file ErrorBoundary.tsx
 *
 * Global error boundary components for the Maqwad application.
 *
 * Provides two boundary layers:
 *  1. `ErrorBoundary` — a React class component that catches render-time errors
 *     anywhere in its subtree and renders a recoverable fallback UI.
 *  2. `QueryAwareErrorBoundary` — wraps `ErrorBoundary` inside TanStack Query's
 *     `QueryErrorResetBoundary` so that clicking "retry" also resets failed query
 *     cache entries, ensuring the user gets fresh data after recovery.
 *
 * Architecture location: `src/shared/components/error/`
 * Consumed by: `AppProviders` (src/app/providers.tsx) as the outermost error catch
 * around `RouterProvider`.
 */

import { Component, type ErrorInfo, type ReactNode } from "react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

// ---------------------------------------------------------------------------
// Props & State Interfaces
// ---------------------------------------------------------------------------

/**
 * Props accepted by the `ErrorBoundary` component.
 *
 * @property children     - The component subtree to protect.
 * @property fallback     - Optional custom fallback UI rendered when an error is caught.
 *                          When omitted, the built-in bilingual (AR/EN) fallback is used.
 * @property onError      - Optional callback invoked when an error is caught.
 *                          Useful for logging, monitoring, or analytics integration.
 * @property onReset      - Optional callback invoked when the user triggers a reset.
 *                          Used by `QueryAwareErrorBoundary` to clear failed query cache.
 */
export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

/** Internal state for the `ErrorBoundary` class component. */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ---------------------------------------------------------------------------
// ErrorBoundary (Class Component)
// ---------------------------------------------------------------------------

/**
 * A React error boundary that catches JavaScript errors anywhere in its child
 * component tree, logs them, and displays a fallback UI instead of crashing
 * the whole application.
 *
 * **Why a class component?**
 * React does not (as of React 19) support error boundaries via function
 * components or hooks. The `componentDidCatch` and `getDerivedStateFromError`
 * lifecycle methods are only available in class components.
 *
 * @example
 * ```tsx
 * <ErrorBoundary onError={(err) => sendToSentry(err)}>
 *   <App />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * Derives error state from a thrown error.
   * Called during the "render" phase — no side effects allowed.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Invoked after an error has been thrown by a descendant component.
   * This is the right place for side effects like logging.
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development for DX visibility
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary] Caught error:", error, errorInfo);
    }
  }

  /** Resets the boundary state so children can attempt to re-render. */
  private handleReset = (): void => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // If a custom fallback was provided, render it as-is
    if (this.props.fallback) {
      return this.props.fallback;
    }

    return <DefaultErrorFallback error={this.state.error} onReset={this.handleReset} />;
  }
}

// ---------------------------------------------------------------------------
// Default Fallback UI
// ---------------------------------------------------------------------------

/** Props for the internal default fallback component. */
interface DefaultErrorFallbackProps {
  error: Error | null;
  onReset: () => void;
}

/**
 * Built-in error fallback screen displayed when no custom `fallback` prop
 * is provided. Renders bilingual text (Arabic primary, English secondary)
 * and a reset button. Fully RTL-friendly, uses design system tokens.
 */
function DefaultErrorFallback({ error, onReset }: DefaultErrorFallbackProps) {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-ink-50 p-6"
      dir="rtl"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex w-full max-w-md flex-col items-center gap-6 rounded-[var(--radius-xl)] border border-danger-500/20 bg-white p-10 text-center shadow-[var(--shadow-3)]">
        {/* Icon */}
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger-50">
          <AlertTriangle className="h-8 w-8 text-danger-500" aria-hidden="true" />
        </div>

        {/* Arabic heading & subtext */}
        <div className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-ink-900">
            حدث خطأ غير متوقع
          </h2>
          <p className="text-sm text-ink-500">
            نعتذر عن هذا الخطأ. يمكنك المحاولة مرة أخرى أو العودة لاحقاً.
          </p>
        </div>

        {/* English subtext for bilingual support */}
        <p className="text-xs text-ink-400" dir="ltr">
          An unexpected error occurred. You can try again or come back later.
        </p>

        {/* Error details in development */}
        {import.meta.env.DEV && error && (
          <details className="w-full rounded-[var(--radius-sm)] bg-ink-100 p-3 text-start">
            <summary className="cursor-pointer text-xs font-medium text-ink-700" dir="ltr">
              Error Details (dev only)
            </summary>
            <pre
              className="mt-2 overflow-x-auto text-xs text-danger-500"
              dir="ltr"
            >
              {error.message}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}

        {/* Reset button */}
        <Button variant="primary" size="md" onClick={onReset} className="gap-2">
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          حاول مرة أخرى
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// QueryAwareErrorBoundary
// ---------------------------------------------------------------------------

/**
 * Props for the `QueryAwareErrorBoundary` wrapper.
 * Accepts the same props as `ErrorBoundary` minus `onReset`, which is
 * automatically wired to TanStack Query's reset function.
 */
export interface QueryAwareErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

/**
 * Wraps `ErrorBoundary` inside TanStack Query's `QueryErrorResetBoundary`.
 *
 * When the user clicks the "retry" button in the error fallback UI, this
 * component ensures that:
 *  1. The React error boundary state resets (re-rendering children).
 *  2. TanStack Query's failed query cache is cleared, so re-mounted queries
 *     fetch fresh data instead of replaying stale errors.
 *
 * This is the recommended component to use at the provider level.
 *
 * @example
 * ```tsx
 * <QueryAwareErrorBoundary>
 *   <RouterProvider router={router} />
 * </QueryAwareErrorBoundary>
 * ```
 */
export function QueryAwareErrorBoundary({
  children,
  fallback,
  onError,
}: QueryAwareErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary fallback={fallback} onError={onError} onReset={reset}>
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}

// Default export for flexible import patterns
export default ErrorBoundary;
