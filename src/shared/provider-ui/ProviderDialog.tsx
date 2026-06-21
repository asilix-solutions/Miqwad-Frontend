/**
 * @file ProviderDialog.tsx
 *
 * Provider design-system dialog shell built on the Radix Dialog primitive.
 * Provides the standard provider identity: rounded-lg surface, provider-lg shadow,
 * generous padding, smooth scale-in / fade-out animation, close X button,
 * header (title + optional description), scrollable body, optional footer.
 *
 * This component becomes the standard dialog shell for all provider flows,
 * replacing the raw admin Dialog imports in dealer pages.
 * Caller still guards mount with `{open && <ProviderDialog ... />}` if desired.
 *
 * All visible text (title, description, footer labels) comes from the caller.
 * No i18n inside this component.
 *
 * Architecture: src/shared/provider-ui/ — reused across dealer, workshop, scrap.
 */

import { useId, type ReactNode } from "react";
import { X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { cn } from "@shared/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

/** Props for {@link ProviderDialog}. */
export interface ProviderDialogProps {
  /** Controls whether the dialog is open. */
  open: boolean;
  /** Called when the dialog requests a state change (close button, overlay click, Escape). */
  onOpenChange: (open: boolean) => void;
  /** Dialog heading — rendered as the Radix DialogTitle for a11y. */
  title: string;
  /** Optional subheading below the title. Sets aria-describedby automatically. */
  description?: string;
  /** Dialog body content — scrollable when it overflows. */
  children: ReactNode;
  /** Optional footer slot for action buttons, rendered below a divider. */
  footer?: ReactNode;
  /** Controls the maximum width of the dialog panel. @default "md" */
  size?: "sm" | "md" | "lg";
  /**
   * Adds `backdrop-blur-sm` to the overlay so the page content blurs behind
   * the dialog, creating a frosted-glass floating effect.
   * Additive and non-breaking — existing dialogs are unaffected (default false).
   * @default false
   */
  blurBackdrop?: boolean;
}

// ── Style maps ────────────────────────────────────────────────────────────────

const SIZE_CLASS: Record<"sm" | "md" | "lg", string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-xl",
  lg: "sm:max-w-2xl",
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * Provider dialog shell.
 *
 * @example
 * ```tsx
 * {open && (
 *   <ProviderDialog
 *     open={open}
 *     onOpenChange={setOpen}
 *     title={t("dealer.products.form.createTitle")}
 *     description={t("dealer.products.form.createSubtitle")}
 *     footer={
 *       <>
 *         <Button variant="outline" onClick={() => setOpen(false)}>
 *           {t("common.cancel")}
 *         </Button>
 *         <Button type="submit">{t("common.save")}</Button>
 *       </>
 *     }
 *   >
 *     <ProductForm />
 *   </ProviderDialog>
 * )}
 * ```
 */
export function ProviderDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  blurBackdrop = false,
}: ProviderDialogProps) {
  // Per-instance unique ID to tie description to content for a11y.
  const uid = useId();
  const descId = description ? `${uid}-desc` : undefined;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* ── Backdrop ─────────────────────────────────────────────────────── */}
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/40",
            blurBackdrop && "backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          )}
          style={{ animationDuration: "var(--dur-fast)" }}
        />

        {/* ── Panel ────────────────────────────────────────────────────────── */}
        {/*
          Positioning: physical left/top + translate so the dialog is
          viewport-centred regardless of document direction (RTL-safe for modals).
        */}
        <DialogPrimitive.Content
          aria-describedby={descId}
          className={cn(
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "w-full max-w-[calc(100%-2rem)]",
            SIZE_CLASS[size],
            // Layout: flex column so header/footer are sticky, body scrolls
            "flex max-h-[85vh] flex-col",
            // Provider surface
            "rounded-[var(--radius-lg)] bg-[var(--color-surface)]",
            "shadow-[var(--shadow-provider-lg)] outline-none",
            // Motion — provider scale-in on open, fade-out on close (tw-animate-css)
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          )}
          style={{ animationDuration: "var(--dur-base)" }}
        >
          {/* ── Header ───────────────────────────────────────────────────── */}
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--color-divider)] px-6 py-5">
            <div className="flex min-w-0 flex-col gap-0.5">
              <DialogPrimitive.Title className="text-base font-semibold leading-snug text-[var(--color-ink-body)]">
                {title}
              </DialogPrimitive.Title>

              {description && (
                <DialogPrimitive.Description
                  id={descId}
                  className="text-sm text-[var(--color-muted)]"
                >
                  {description}
                </DialogPrimitive.Description>
              )}
            </div>

            {/* Close button */}
            <DialogPrimitive.Close
              aria-label="Close"
              className={cn(
                "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center",
                "rounded-[var(--radius-sm)] text-[var(--color-muted)] outline-none",
                "transition-colors duration-[var(--dur-fast)]",
                "hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)]",
                "focus-visible:ring-2 focus-visible:ring-[var(--color-brand-orange)]/40",
              )}
            >
              <X className="h-4 w-4" aria-hidden />
            </DialogPrimitive.Close>
          </div>

          {/* ── Scrollable body ───────────────────────────────────────────── */}
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>

          {/* ── Footer ───────────────────────────────────────────────────── */}
          {footer && (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-[var(--color-divider)] px-6 py-4">
              {footer}
            </div>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
