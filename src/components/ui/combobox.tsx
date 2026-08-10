"use client"

/**
 * @file combobox.tsx
 * @description Searchable single-select combobox. No such primitive existed
 * in the codebase before this file (no `cmdk`/`react-popover` wrapper) — built
 * on the `Popover` primitive from the already-installed `radix-ui` umbrella
 * package rather than adding a new dependency. Used by the attachments owner
 * picker; generic enough for other future admin pickers.
 */
import * as React from "react"
import { Popover as PopoverPrimitive } from "radix-ui"
import { Check, ChevronDown, Search } from "lucide-react"

import { cn } from "@shared/lib/utils"

export interface ComboboxOption {
  value: string
  label: string
  description?: string
}

export interface ComboboxProps {
  options: ComboboxOption[]
  value: string | null
  onValueChange: (value: string) => void
  onSearchChange?: (search: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  loading?: boolean
  disabled?: boolean
  className?: string
  invalid?: boolean
}

function Combobox({
  options,
  value,
  onValueChange,
  onSearchChange,
  placeholder,
  searchPlaceholder,
  emptyText,
  loading,
  disabled,
  className,
  invalid,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const selected = options.find((option) => option.value === value)

  const handleSearchChange = (next: string) => {
    setSearch(next)
    onSearchChange?.(next)
  }

  return (
    <PopoverPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) handleSearchChange("")
      }}
    >
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-invalid={invalid}
          data-slot="combobox-trigger"
          className={cn(
            "flex h-[var(--size-input-h)] w-full items-center justify-between gap-2 rounded-[var(--radius-md)] border border-input bg-transparent px-3 text-sm shadow-xs outline-none transition-[color,box-shadow]",
            "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            "aria-invalid:border-danger-500 aria-invalid:ring-danger-500/20",
            "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
            className,
          )}
        >
          <span className={cn("truncate text-start", !selected && "text-muted-foreground")}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          className={cn(
            "z-50 w-[var(--radix-popover-trigger-width)] overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-divider)] bg-[var(--color-surface)] shadow-lg",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
          )}
        >
          <div className="flex items-center gap-2 border-b border-[var(--color-divider)] px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {loading && (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">…</div>
            )}
            {!loading && options.length === 0 && (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">{emptyText}</div>
            )}
            {!loading &&
              options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onValueChange(option.value)
                    setOpen(false)
                    handleSearchChange("")
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] px-3 py-2 text-start text-sm hover:bg-[var(--color-surface-2)]",
                    option.value === value && "bg-[var(--color-surface-2)]",
                  )}
                >
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{option.label}</span>
                    {option.description && (
                      <span className="truncate text-xs text-muted-foreground">{option.description}</span>
                    )}
                  </span>
                  {option.value === value && <Check className="size-4 shrink-0" />}
                </button>
              ))}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  )
}

export { Combobox }
