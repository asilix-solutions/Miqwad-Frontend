import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Clock, Edit, Tag, Trash2 } from "lucide-react";
import { Button } from "@shared/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ProviderService } from "../types";

interface Props {
  service: ProviderService;
  onDelete: (id: number) => void;
}

/**
 * Compact card shown on the provider's services list.
 *
 * Responsive layout:
 *  - xs: single column, actions stack below name.
 *  - sm+: 2-column grid; actions inline.
 */
export function ProviderServiceCard({ service, onDelete }: Props) {
  const { t } = useTranslation();

  return (
    <article className="rounded-[var(--radius-md)] border border-ink-200 bg-white p-4 sm:p-5 flex flex-col gap-3 transition-shadow hover:shadow-[var(--shadow-2)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display text-base font-semibold text-ink-900 line-clamp-2">
            {service.name}
          </h3>
          {service.categoryName && (
            <Badge tone="brand" size="sm" className="mt-2">
              <Tag className="h-3 w-3" />
              {service.subcategoryName ?? service.categoryName}
            </Badge>
          )}
        </div>
        <div className="text-end shrink-0">
          <p className="font-display text-xl font-bold text-brand-600">
            {service.price.toLocaleString()}
          </p>
          <p className="text-[11px] text-ink-400">SAR</p>
        </div>
      </div>

      {service.description && (
        <p className="text-sm text-ink-500 line-clamp-2">{service.description}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-ink-100">
        {service.estimatedDuration ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-500">
            <Clock className="h-3.5 w-3.5" />
            {service.estimatedDuration} {t("providers.services.minutesShort")}
          </span>
        ) : (
          <span />
        )}
        <div className="flex gap-2 ms-auto">
          <Button asChild variant="outline" size="sm">
            <Link to={`/provider/services/${service.id}/edit`}>
              <Edit className="h-3.5 w-3.5" />
              {t("common.edit")}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(service.id)}
            aria-label={t("common.delete")}
            className="text-danger-500 hover:bg-danger-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </article>
  );
}
