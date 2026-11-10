/** Display operational guidance and independently observable restrictions, not permission. */
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { AlertCircle, ArrowDown, ShieldAlert } from "lucide-react";
import { useAppSelector } from "@app/store";
import { driverOperationBlocks, initialOperationBlocks } from "../lib/driverOperationGuards";
import { cancellationBlocks } from "../lib/cancellationJournal";
import { initialAssignmentBlock, nextActionMessage } from "../lib/dispatchModel";
import { readRemovalEvidence } from "../lib/reassignment";
import type { TowTruckOrder } from "../lib/towTruckModel";

interface Props {
  order: TowTruckOrder;
  removalHistory?: boolean;
  stale?: boolean;
}

export function TowTruckOperationalSummary({ order, stale = false }: Props) {
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

  // These are visible observations, never substitutes for mutation guards.
  const restrictions = [
    ...(stale ? ["p4rStaleWarning"] : []),
    ...(held ? ["opsMutationConflict"] : []),
    ...(order.dispatchService === "unknown" ? ["r2ServiceUnverified"] : []),
    ...(order.stage === "checkDetails" ? ["p4rTripEvidenceWarning"] : []),
    ...(order.serviceType === "intercity" &&
    (!order.intercityDetails.originCityName || !order.intercityDetails.destinationCityName)
      ? ["p4rMissingCorridorWarning"]
      : []),
    ...(order.serviceType === "intercity" && order.paymentStatus === "Paid" &&
    order.assignment === "unassigned"
      ? ["p4rPaidIntercityWarning"]
      : []),
    ...(!order.paymentStatus ? ["p3rPaymentUnknown"] : []),
  ];

  return (
    <section className="tow-order-decision" aria-labelledby="tow-operational-summary-heading">
      <div className="tow-p4r-decision-header">
        <div className="tow-p4r-decision-icon"><ShieldAlert size={19} aria-hidden="true" /></div>
        <div>
          <p className="tow-p4r-eyebrow">{t("towTruck.operationalSummary")}</p>
          <h2 id="tow-operational-summary-heading">{t("towTruck.p4rDecisionHeading")}</h2>
        </div>
        <a className="tow-p4r-action-link" href="#tow-order-action">
          {t("towTruck.p4rGoToAction")}
          <ArrowDown size={15} aria-hidden="true" />
        </a>
      </div>
      <p className="tow-p4r-primary-guidance">
        <strong>{t("towTruck.p4rReviewFocus")}</strong>
        {t(`towTruck.${nextActionKey}`)}
      </p>
      {restrictions.length > 0 && (
        <div className="tow-p4r-restrictions" aria-label={t("towTruck.p4rRestrictionsTitle")}>
          <h3>
            <AlertCircle size={16} aria-hidden="true" />
            {t("towTruck.p4rRestrictionsTitle")}
          </h3>
          <ul>
            {restrictions.map((key) => (
              <li key={key}>{t(`towTruck.${key}`)}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="tow-p4r-guidance-footer">{t("towTruck.p4rNotAuthorization")}</p>
    </section>
  );
}
