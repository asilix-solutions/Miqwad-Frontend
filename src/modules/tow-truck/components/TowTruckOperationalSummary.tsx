import { useQueryClient } from "@tanstack/react-query";
import { driverOperationBlocks, initialOperationBlocks } from "../lib/driverOperationGuards";
import { cancellationBlocks } from "../lib/cancellationJournal";
import { useAppSelector } from "@app/store";
import { initialAssignmentBlock } from "../lib/dispatchModel";
import { readRemovalEvidence } from "../lib/reassignment";
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

export function TowTruckOperationalSummary({ order }: Props) {
  const { t } = useTranslation();

  const actor = useAppSelector((state) => state.auth.user?.id) ?? "";
  const evidence = readRemovalEvidence(actor, order.id);
  const qc = useQueryClient();
  const held =
    driverOperationBlocks(qc, actor) ||
    initialOperationBlocks(qc, actor) ||
    cancellationBlocks(qc, actor, order.id);
  const nextActionKey = held
    ? "opsMutationConflict"
    : order.assignment === "unassigned"
      ? (initialAssignmentBlock(order, evidence) ??
        (evidence ? "r2ReplacementReady" : "initialReady"))
      : nextActionMessage(order);

  return (
    <section
      className="border-brand-200 from-brand-50/70 to-brand-50/40 space-y-3 rounded-2xl border bg-linear-to-r via-white p-5 shadow-xs lg:p-6"
      aria-labelledby="tow-operational-summary-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-brand-orange/15 text-brand-orange flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
            <AlertCircle size={17} aria-hidden="true" />
          </div>
          <div>
            <span className="text-ink-500 text-[11px] font-bold tracking-wider uppercase">
              {t("towTruck.operationalSummary")}
            </span>
            <h2 id="tow-operational-summary-heading" className="text-ink-900 text-base font-bold">
              {t("towTruck.verifiedStage")}
            </h2>
          </div>
        </div>

        <TowTruckStageBadge stage={order.stage} />
      </div>

      <div className="border-brand-200/80 space-y-1.5 rounded-xl border bg-white p-4 shadow-2xs">
        <span className="text-brand-blue flex items-center gap-1.5 text-xs font-bold">
          <span>{t("towTruck.nextAction")}:</span>
        </span>
        <p className="text-ink-800 text-xs leading-relaxed font-medium">
          {t(`towTruck.${nextActionKey}`)}
        </p>
      </div>
    </section>
  );
}
