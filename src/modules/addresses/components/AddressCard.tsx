/**
 * @file AddressCard.tsx
 * @description Single address card for the spatial card grid — a static
 * mini-map thumbnail (lazy-mounted near viewport), title/description,
 * shortNumber badge, coordinates, owner, relative createdAt, and row
 * actions. Mirrors the visual language of AttachmentCard.tsx.
 */
import { MapPin, Pencil, Trash2, User } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Can } from "@shared/auth/Can";
import { AddressMiniMap } from "./AddressMiniMap";
import { useInViewport } from "../hooks/useInViewport";
import { formatRelativeDate } from "../lib/formatRelativeDate";
import type { Address } from "../types";

interface Props {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (address: Address) => void;
}

export function AddressCard({ address, onEdit, onDelete }: Props) {
  const { t, i18n } = useTranslation();
  const { ref, inView } = useInViewport<HTMLDivElement>();

  return (
    <div className="flex flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-divider)] bg-[var(--color-surface)] shadow-[var(--shadow-2)] transition-shadow hover:shadow-lg">
      <div ref={ref} className="relative h-[140px] w-full shrink-0 bg-[var(--color-surface-2)]">
        {inView ? (
          <AddressMiniMap
            latitude={address.latitude}
            longitude={address.longitude}
            alt={t("addresses.card.miniMapAlt", { title: address.title })}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <MapPin className="size-6 text-[var(--color-muted)]" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <p
            className="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--color-ink-body)]"
            title={address.title}
          >
            {address.title}
          </p>
          {address.shortNumber && (
            <Badge tone="neutral" size="sm" className="shrink-0" dir="ltr">
              {address.shortNumber}
            </Badge>
          )}
        </div>

        <p className="line-clamp-2 text-xs text-[var(--color-muted)]" title={address.description}>
          {address.description}
        </p>

        <div className="flex items-center gap-1 text-xs text-[var(--color-muted)]" dir="ltr">
          <span>
            {address.latitude.toFixed(4)}, {address.longitude.toFixed(4)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1 text-xs text-[var(--color-muted)]">
            <User className="size-3 shrink-0" />
            <span className="min-w-0 truncate text-start">
              {t("addresses.card.owner", { id: address.userId })}
            </span>
          </div>
          {address.createdAt && (
            <span className="shrink-0 text-xs text-[var(--color-muted)]">
              {formatRelativeDate(address.createdAt, i18n.language)}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-end gap-1 border-t border-[var(--color-divider)] pt-2">
          <Can permission="addresses.edit">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title={t("addresses.actions.edit")}
              onClick={() => onEdit(address)}
            >
              <Pencil className="size-4" />
            </Button>
          </Can>
          <Can permission="addresses.delete">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title={t("addresses.actions.delete")}
              onClick={() => onDelete(address)}
            >
              <Trash2 className="size-4 text-danger-500" />
            </Button>
          </Can>
        </div>
      </div>
    </div>
  );
}
