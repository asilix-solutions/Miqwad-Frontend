/**
 * @file sheet.tsx
 * @description Side/bottom-anchored slide-in panel built on the same Radix
 * Dialog primitive as `dialog.tsx`. No such primitive existed in the
 * codebase before this file — added for the Categories & Services detail
 * panel's mobile/narrow-viewport drawer. RTL-safe: the "end" side uses the
 * logical `inset-inline-end` edge so it opens from the correct side in both
 * ar and en.
 */
"use client"

import * as React from "react"
import { XIcon } from "lucide-react"
import { Dialog as DialogPrimitive } from "radix-ui"

import { cn } from "@shared/lib/utils"

function Sheet({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

type SheetSide = "end" | "bottom"

// Physical slide-direction utilities (tw-animate-css) don't auto-flip for
// RTL, so the "end" side keeps a direction-agnostic fade/zoom instead of a
// slide — the logical `inset-inline-end-0` positioning still lands on the
// correct physical edge in both ar and en.
const SIDE_CLASSES: Record<SheetSide, string> = {
  end: cn(
    "inset-block-0 inset-inline-end-0 h-full w-full max-w-sm border-s",
    "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
    "data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
  ),
  bottom: cn(
    "inset-inline-0 bottom-0 max-h-[85vh] w-full rounded-t-[var(--radius-lg)] border-t",
    "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
  ),
}

function SheetContent({
  className,
  children,
  side = "end",
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  side?: SheetSide
  showCloseButton?: boolean
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <DialogPrimitive.Content
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-[var(--color-surface)] border-[var(--color-divider)] p-6 shadow-lg",
          "duration-200 outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
          SIDE_CLASSES[side],
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="sheet-close"
            className="absolute top-4 end-4 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none"
          >
            <XIcon className="size-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="sheet-header" className={cn("flex flex-col gap-1.5", className)} {...props} />
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col-reverse gap-2 sm:flex-row sm:justify-end", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-base font-semibold text-[var(--color-ink-body)]", className)}
      {...props}
    />
  )
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-[var(--color-muted)]", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPortal,
  SheetOverlay,
  SheetTitle,
  SheetTrigger,
}
