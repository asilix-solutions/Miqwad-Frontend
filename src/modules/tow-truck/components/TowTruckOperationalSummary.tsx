/**
 * @file TowTruckOperationalSummary.tsx
 * @description Operational Summary banner for Tow Truck Workspace.
 * Highlights current verified stage, authoritative next action, and operational advice.
 */
import { useTranslation } from "react-i18next";
import { AlertCircle } from "lucide-react";
import type { TowTruckOrder } from "../lib/towTruckModel";
import { TowTruckStageBadge } from "./TowTruckStatusBadge";
import { nextActionMessage } from "../lib/dispatchModel";

interface Props {
  order: TowTruckOrder;
  removalHistory?: boolean;
}

export function TowTruckOperationalSummary({
  order,
  removalHistory = false,
}: Props) {
  const { t } = useTranslation();

  const nextActionKey = removalHistory
    ? "opsInitialHeld"
    : nextActionMessage(order);

  return (
    <section
      className="rounded-2xl border border-brand-200 bg-linear-to-r from-brand-50/70 via-white to-brand-50/40 p-5 lg:p-6 shadow-xs space-y-3"
      aria-labelledby="tow-operational-summary-heading"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-orange/15 text-brand-orange flex items-center justify-center shrink-0">
            <AlertCircle size={17} aria-hidden="true" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
              {t("towTruck.operationalSummary")}
            </span>
            <h2 id="tow-operational-summary-heading" className="text-base font-bold text-ink-900">
              {t("towTruck.verifiedStage")}
            </h2>
          </div>
        </div>

        <TowTruckStageBadge stage={order.stage} />
      </div>

      <div className="rounded-xl border border-brand-200/80 bg-white p-4 shadow-2xs space-y-1.5">
        <span className="text-xs font-bold text-brand-blue flex items-center gap-1.5">
          <span>{t("towTruck.nextAction")}:</span>
        </span>
        <p className="text-xs text-ink-800 font-medium leading-relaxed">
          {t(`towTruck.${nextActionKey}`)}
        </p>
      </div>
    </section>
  );
}
