import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { ClipboardList, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@shared/auth/usePermissions";
import { adminApi } from "@modules/admin/api/adminApi";
import { adminKeys } from "@modules/admin/hooks/useAdminQueries";
import type { AdminUserRow } from "@modules/admin/types";
import { orderDetailOptions } from "@modules/orders/hooks/useOrdersQueries";
import { useInitialAssignment } from "../hooks/useInitialAssignment";
import { useTowTruckDrivers } from "../hooks/useTowTruckDrivers";
import { adaptTowTruck, type TowTruckOrder } from "../lib/towTruckModel";
import {
  canSelectDriver,
  dispatchDraftSchema,
  dispatchSnapshot,
  initialAssignmentBlock,
  type DispatchDraft,
} from "../lib/dispatchModel";

export function TowTruckDispatch({
  order,
  onDirtyChange,
  onBusyChange,
  stale,
}: {
  order: TowTruckOrder;
  onDirtyChange: (dirty: boolean) => void;
  onBusyChange: (busy: boolean) => void;
  stale: boolean;
}) {
  const { t } = useTranslation();
  const { can } = usePermissions();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminUserRow | null>(null);
  const [review, setReview] = useState<{ values: DispatchDraft; snapshot: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reviewing = useRef(false);
  const reviewHeading = useRef<HTMLHeadingElement>(null);
  const assignment = useInitialAssignment(order.id);
  const busy = assignment.state.phase === "busy";
  const initialBlock = initialAssignmentBlock(order);
  const canEdit = ["idle", "rejected", "retryable"].includes(assignment.state.phase);
  const canPrepare = can("orders.manage") && can("users.view");
  const drivers = useTowTruckDrivers(page, editing && canPrepare);
  const form = useForm<DispatchDraft>({
    resolver: zodResolver(dispatchDraftSchema(true)),
    defaultValues: { driverId: "", cost: "", duration: "" },
  });
  const { isDirty, isSubmitting, errors } = form.formState;
  useEffect(() => {
    onDirtyChange(isDirty && canEdit);
    return () => onDirtyChange(false);
  }, [isDirty, canEdit, onDirtyChange]);
  useEffect(() => {
    onBusyChange(busy);
    return () => onBusyChange(false);
  }, [busy, onBusyChange]);
  useEffect(() => {
    if (review) reviewHeading.current?.focus();
  }, [review]);

  const reviewDraft = async (values: DispatchDraft) => {
    if (
      reviewing.current ||
      !canEdit ||
      initialBlock ||
      !canPrepare ||
      stale ||
      !selected ||
      !canSelectDriver(selected)
    )
      return;
    reviewing.current = true;
    setError(null);
    try {
      // GET-only review. Nothing is optimistically written to the Orders cache.
      const [raw, driver] = await Promise.all([
        qc.fetchQuery({ ...orderDetailOptions(order.id), staleTime: 0 }),
        qc.fetchQuery({
          queryKey: adminKeys.user(values.driverId),
          queryFn: () => adminApi.getUser(values.driverId),
          staleTime: 0,
        }),
      ]);
      const latest = adaptTowTruck(raw);
      if (
        latest.id !== order.id ||
        initialAssignmentBlock(latest) ||
        dispatchSnapshot(latest) !== dispatchSnapshot(order)
      ) {
        setError("requestChanged");
      } else if (
        driver.id !== values.driverId ||
        !canSelectDriver(driver) ||
        driver.id === latest.driverId
      ) {
        setError("driverChanged");
      } else {
        setSelected(driver);
        setReview({ values, snapshot: dispatchSnapshot(latest) });
      }
    } catch {
      setError("reviewFailed");
    } finally {
      reviewing.current = false;
    }
  };
  const reviewChanged = !!review && review.snapshot !== dispatchSnapshot(order);
  const confirmAssignment = async () => {
    if (!review || !canEdit || initialBlock || stale || reviewChanged || !canPrepare) return;
    const result = await assignment.submit(review);
    if (result.phase === "success") {
      form.reset();
      setReview(null);
      setEditing(false);
    } else if (["retryable", "rejected"].includes(result.phase)) setReview(null);
  };
  const checkOutcome = async () => {
    const result = await assignment.check();
    if (result.phase === "success") {
      form.reset();
      setReview(null);
      setEditing(false);
    } else if (result.phase === "retryable") setReview(null);
  };
  return (
    <section className="tow-section tow-dispatch" aria-labelledby="tow-dispatch-title">
      <h3 id="tow-dispatch-title" tabIndex={-1} className="tow-section-title">
        <ClipboardList size={18} aria-hidden="true" />
        {t("towTruck.dispatchTitle")}
      </h3>
      <div className="tow-action-notice" id="tow-dispatch-blocked">
        <LockKeyhole size={18} aria-hidden="true" />
        <div>
          <strong>{t("towTruck.initialOnly")}</strong>
          <p>{t(`towTruck.${initialBlock ?? "initialReady"}`)}</p>
        </div>
      </div>
      {assignment.state.message && (
        <div
          className="tow-assignment-result"
          role={assignment.state.phase === "rejected" ? "alert" : "status"}
          aria-live="polite"
        >
          <strong>{t(`towTruck.${assignment.state.message}`)}</strong>
          {!!assignment.state.details?.length && (
            <ul>
              {assignment.state.details.map((message, index) => (
                <li key={index}>{message}</li>
              ))}
            </ul>
          )}
          {assignment.state.receipt && assignment.state.phase === "success" && (
            <p>
              {t("towTruck.sentQuote", {
                cost: assignment.state.receipt.cost,
                duration: assignment.state.receipt.duration,
              })}
            </p>
          )}
          {["uncertain", "accepted"].includes(assignment.state.phase) && (
            <Button variant="outline" disabled={!canPrepare} onClick={() => void checkOutcome()}>
              {t("towTruck.checkOutcome")}
            </Button>
          )}
        </div>
      )}
      {!canPrepare ? (
        <p className="tow-hint">{t("towTruck.preparePermission")}</p>
      ) : !canEdit && !busy ? null : !editing ? (
        <div className="tow-prepare-intro">
          <p className="tow-description">{t("towTruck.prepareHint")}</p>
          <Button
            variant="outline"
            disabled={stale || !!initialBlock || busy}
            onClick={() => setEditing(true)}
          >
            {t("towTruck.prepare")}
          </Button>
          {order.assignment === "unknown" && (
            <p className="tow-hint">{t("towTruck.driverStateUnknown")}</p>
          )}
        </div>
      ) : review ? (
        <div className="tow-draft-review">
          <h4 ref={reviewHeading} tabIndex={-1}>
            {t("towTruck.confirmInitial")}
          </h4>
          <p className="tow-hint">{t("towTruck.confirmInitialHint")}</p>
          {(reviewChanged || stale) && (
            <p className="tow-warning" role="alert">
              {t("towTruck.requestChanged")}
            </p>
          )}
          <dl className="tow-draft-summary">
            <div>
              <dt>{t("towTruck.selected")}</dt>
              <dd>
                <bdi>{order.number}</bdi>
              </dd>
            </div>
            <div>
              <dt>{t("towTruck.proposedDriver")}</dt>
              <dd>
                {selected?.fullName || t("towTruck.driverMissing")}{" "}
                <bdi>#{review.values.driverId}</bdi>
              </dd>
            </div>
            <div>
              <dt>{t("towTruck.proposedCost")}</dt>
              <dd>
                <bdi>{review.values.cost}</bdi>
              </dd>
            </div>
            <div>
              <dt>{t("towTruck.proposedDuration")}</dt>
              <dd>{review.values.duration}</dd>
            </div>
          </dl>
          <Button variant="outline" disabled={busy} onClick={() => setReview(null)}>
            {t("towTruck.editDraft")}
          </Button>
          <Button
            className="tow-submit"
            disabled={busy || stale || reviewChanged || !!initialBlock || !canEdit || !canPrepare}
            onClick={() => void confirmAssignment()}
          >
            {t(
              busy
                ? `towTruck.${assignment.state.message ?? "assignmentChecking"}`
                : "towTruck.assignDriver",
            )}
          </Button>
        </div>
      ) : (
        <form
          onSubmit={(event) => {
            void form.handleSubmit(reviewDraft)(event);
          }}
          className="tow-dispatch-form"
          noValidate
        >
          <p className="tow-hint">{t("towTruck.localOnly")}</p>
          <fieldset disabled={isSubmitting || busy || !!initialBlock}>
            <legend>{t("towTruck.chooseDriver")}</legend>
            <Button
              type="button"
              variant="ghost"
              disabled={drivers.isFetching}
              onClick={() => void drivers.refetch()}
            >
              {t("towTruck.refresh")}
            </Button>
            <p className="tow-hint" id="tow-driver-help">
              {t("towTruck.driverChoiceHint")}
            </p>
            {selected && (
              <p className="tow-selected-driver">
                {t("towTruck.proposedDriver")}: {selected.fullName || t("towTruck.driverMissing")}{" "}
                <bdi>#{selected.id}</bdi>
              </p>
            )}
            {drivers.isFetching ? (
              <p role="status" className="tow-driver-loading">
                {t("towTruck.loadingDrivers")}
              </p>
            ) : drivers.isError ? (
              <div role="alert">
                <p>{t("towTruck.driverLoadError")}</p>
                <Button type="button" variant="outline" onClick={() => void drivers.refetch()}>
                  {t("towTruck.retry")}
                </Button>
              </div>
            ) : (
              drivers.data && (
                <>
                  <div className="tow-driver-options">
                    {drivers.data.items.map((driver) => (
                      <label key={driver.id} className="tow-driver-option">
                        <input
                          type="radio"
                          value={driver.id}
                          {...form.register("driverId")}
                          disabled={!canSelectDriver(driver) || driver.id === order.driverId}
                          aria-describedby="tow-driver-help tow-driver-error"
                          onChange={(event) => {
                            void form.register("driverId").onChange(event);
                            setSelected(driver);
                          }}
                        />
                        <span>
                          <strong>{driver.fullName || t("towTruck.driverMissing")}</strong>
                          <small>
                            <bdi>#{driver.id}</bdi> ·{" "}
                            {t(
                              `towTruck.${driver.id === order.driverId ? "currentDriver" : driver.isActive ? "activeAccount" : "inactiveAccount"}`,
                            )}
                          </small>
                        </span>
                      </label>
                    ))}
                  </div>
                  {!drivers.data.items.length && (
                    <p className="tow-hint">{t("towTruck.noDrivers")}</p>
                  )}
                  {page > Math.max(1, drivers.data.totalPages) ? (
                    <Button type="button" variant="outline" onClick={() => setPage(1)}>
                      {t("towTruck.firstPage")}
                    </Button>
                  ) : (
                    <nav className="tow-driver-pagination" aria-label={t("towTruck.driverPages")}>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={page <= 1}
                        onClick={() => setPage(page - 1)}
                      >
                        {t("towTruck.previous")}
                      </Button>
                      <span>
                        {t("towTruck.pageOf", {
                          page,
                          total: Math.max(drivers.data.totalPages, 1),
                        })}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        disabled={page >= drivers.data.totalPages}
                        onClick={() => setPage(page + 1)}
                      >
                        {t("towTruck.next")}
                      </Button>
                    </nav>
                  )}
                </>
              )
            )}
            <p id="tow-driver-error" className="tow-form-error" role="alert">
              {errors.driverId ? t("towTruck.driverRequired") : ""}
            </p>
            <div className="tow-quote-fields">
              <label>
                {t("towTruck.proposedCost")}
                <input
                  {...form.register("cost")}
                  inputMode="decimal"
                  dir="ltr"
                  autoComplete="off"
                  aria-invalid={!!errors.cost}
                  aria-describedby="tow-cost-error tow-cost-help"
                />
                <small id="tow-cost-help">{t("towTruck.costHelp")}</small>
                <span id="tow-cost-error" className="tow-form-error">
                  {errors.cost ? t("towTruck.costInvalid") : ""}
                </span>
              </label>
              <label>
                {t("towTruck.proposedDuration")}
                <input
                  {...form.register("duration")}
                  maxLength={100}
                  autoComplete="off"
                  aria-invalid={!!errors.duration}
                  aria-describedby="tow-duration-error"
                  placeholder={t("towTruck.durationExample")}
                />
                <span id="tow-duration-error" className="tow-form-error">
                  {errors.duration ? t("towTruck.durationInvalid") : ""}
                </span>
              </label>
            </div>
          </fieldset>
          {error && (
            <p role="alert" className="tow-form-error">
              {t(`towTruck.${error}`)}
            </p>
          )}
          {stale && <p className="tow-hint">{t("towTruck.reviewNeedsFresh")}</p>}
          <Button
            type="submit"
            disabled={isSubmitting || busy || !canEdit || !!initialBlock || stale || !selected}
          >
            {t(`towTruck.${isSubmitting ? "reviewingDraft" : "reviewDraft"}`)}
          </Button>
        </form>
      )}
      {order.assignment === "assigned" && (
        <div className="tow-unavailable-actions" aria-describedby="tow-dispatch-blocked">
          <Button variant="outline" disabled>
            {t("towTruck.reassignDriver")}
          </Button>
          <Button variant="outline" disabled>
            {t("towTruck.unassignDriver")}
          </Button>
        </div>
      )}
    </section>
  );
}
