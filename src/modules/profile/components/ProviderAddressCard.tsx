/**
 * @file ProviderAddressCard.tsx
 *
 * Provider-styled address row for {@link ProviderAddressesSection}. Visually
 * distinct from the admin `AddressCard` (no mini-map thumbnail, no owner
 * column, no `Can` permission gating — every address in this section already
 * belongs to the signed-in provider). Edit/delete are plain callbacks; the
 * section owns the dialog/confirm state.
 */
import { MapPin, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Address } from "@modules/addresses/types";

interface ProviderAddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (address: Address) => void;
}

export function ProviderAddressCard({ address, onEdit, onDelete }: ProviderAddressCardProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--color-divider)] bg-[var(--color-surface)] p-4 transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-surface-2)]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand-50)]">
        <MapPin className="h-4 w-4 text-[var(--color-brand-orange)]" aria-hidden />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-[var(--color-ink-body)]" title={address.title}>
            {address.title}
          </p>
          {address.shortNumber && (
            <span
              dir="ltr"
              className="shrink-0 rounded-full bg-[var(--color-surface-2)] px-2 py-0.5 text-xs text-[var(--color-muted)]"
            >
              {address.shortNumber}
            </span>
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-[var(--color-muted)]" title={address.description}>
          {address.description}
        </p>
        <p dir="ltr" className="mt-1 text-xs text-[var(--color-muted)]">
          {address.latitude.toFixed(4)}, {address.longitude.toFixed(4)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onEdit(address)}
          aria-label={t("accountProfile.addresses.edit")}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-muted)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink-body)]"
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => onDelete(address)}
          aria-label={t("accountProfile.addresses.delete")}
          className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-muted)] transition-colors duration-[var(--dur-fast)] hover:bg-[var(--color-danger-500)]/10 hover:text-[var(--color-danger-500)]"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
