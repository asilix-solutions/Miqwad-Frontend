import { useTranslation } from "react-i18next";
import { Wrench } from "lucide-react";
import { EmptyState } from "@shared/components/feedback/EmptyState";
import { LoadingState } from "@shared/components/feedback/LoadingState";
import { ErrorState } from "@shared/components/feedback/ErrorState";
import type { MaintenanceRecord } from "../types";

interface Props {
  records: MaintenanceRecord[] | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
}

/**
 * Read-only table that renders the maintenance history.
 *
 * Layout switches between table (md+) and stacked cards (mobile)
 * because dense numeric tables don't read well on narrow screens.
 */
export function MaintenanceHistoryTable({ records, isLoading, isError, onRetry }: Props) {
  const { t } = useTranslation();

  if (isLoading) return <LoadingState />;
  if (isError) return <ErrorState onRetry={onRetry} />;
  if (!records || records.length === 0) {
    return (
      <EmptyState
        icon={<Wrench className="h-6 w-6 text-ink-500" />}
        title={t("maintenance.empty")}
        description={t("maintenance.emptyDescription")}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-ink-200 bg-white">
      <table className="hidden w-full text-sm md:table">
        <thead className="bg-ink-50 text-ink-500">
          <tr>
            <Th>{t("maintenance.headers.service")}</Th>
            <Th>{t("maintenance.headers.provider")}</Th>
            <Th>{t("maintenance.headers.date")}</Th>
            <Th>{t("maintenance.headers.mileage")}</Th>
            <Th>{t("maintenance.headers.cost")}</Th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id} className="border-t border-ink-100 hover:bg-ink-50/60">
              <Td>
                <div className="font-medium text-ink-900">{r.serviceName}</div>
                {r.notes && <div className="text-xs text-ink-500 mt-0.5 truncate">{r.notes}</div>}
              </Td>
              <Td>{r.providerName ?? "—"}</Td>
              <Td>{formatDate(r.date)}</Td>
              <Td>{r.mileage != null ? formatNumber(r.mileage) + " km" : "—"}</Td>
              <Td>{r.cost != null ? formatNumber(r.cost) + " ﷼" : "—"}</Td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile: stacked cards */}
      <ul className="md:hidden divide-y divide-ink-100">
        {records.map((r) => (
          <li key={r.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-ink-900">{r.serviceName}</p>
                {r.providerName && (
                  <p className="text-xs text-ink-500 mt-0.5">{r.providerName}</p>
                )}
              </div>
              <span className="text-xs text-ink-500 whitespace-nowrap">{formatDate(r.date)}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-500">
              {r.mileage != null && <span>🛣 {formatNumber(r.mileage)} km</span>}
              {r.cost != null && <span>💰 {formatNumber(r.cost)} ﷼</span>}
            </div>
            {r.notes && <p className="mt-2 text-xs text-ink-500">{r.notes}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-4 py-3 align-top text-ink-700">{children}</td>;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(n);
}
