import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Eye, MapPin, Phone } from "lucide-react";
import { Button } from "@shared/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { AdminProvider } from "../types";

interface Props {
  provider: AdminProvider;
  onApprove: (id: number) => void;
  onReject: (provider: AdminProvider) => void;
  isMutating?: boolean;
}

/**
 * Card representing one provider on the Admin Review screen.
 * Responsive: stacks vertically on mobile, side-by-side on tablet+.
 */
export function AdminProviderCard({ provider, onApprove, onReject, isMutating }: Props) {
  const { t } = useTranslation();

  return (
    <article className="rounded-[var(--radius-md)] border border-ink-200 bg-white p-4 sm:p-5 space-y-3">
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display text-base sm:text-lg font-semibold text-ink-900 line-clamp-1">
            {provider.companyName}
          </h3>
          <p className="text-xs text-ink-500">{provider.email}</p>
        </div>
        <Badge tone={statusToTone(provider.status)} size="sm">
          {t(`admin.status${capitalise(provider.status)}` as const)}
        </Badge>
      </header>

      <div className="grid gap-2 text-sm text-ink-700 sm:grid-cols-2">
        <div className="flex items-center gap-2 min-w-0">
          <Phone className="h-4 w-4 text-ink-400 shrink-0" />
          <span className="truncate">{provider.phone}</span>
        </div>
        {provider.city && (
          <div className="flex items-center gap-2 min-w-0">
            <MapPin className="h-4 w-4 text-ink-400 shrink-0" />
            <span className="truncate">{provider.city}</span>
          </div>
        )}
      </div>

      <footer className="flex flex-col-reverse gap-2 pt-2 border-t border-ink-100 sm:flex-row sm:justify-end">
        <Button asChild variant="outline" size="sm">
          <Link to={`/admin/providers/${provider.id}`}>
            <Eye className="h-3.5 w-3.5" />
            {t("admin.viewDetails")}
          </Link>
        </Button>
        {provider.status === "pending" && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReject(provider)}
              disabled={isMutating}
              className="text-danger-500 hover:bg-danger-50 border-danger-500/30"
            >
              {t("admin.reject")}
            </Button>
            <Button size="sm" onClick={() => onApprove(provider.id)} disabled={isMutating}>
              {t("admin.approve")}
            </Button>
          </>
        )}
      </footer>
    </article>
  );
}

function statusToTone(status: AdminProvider["status"]) {
  switch (status) {
    case "approved":
      return "success" as const;
    case "rejected":
      return "danger" as const;
    case "pending":
    default:
      return "warning" as const;
  }
}

function capitalise<T extends string>(s: T) {
  return (s.charAt(0).toUpperCase() + s.slice(1)) as Capitalize<T>;
}
