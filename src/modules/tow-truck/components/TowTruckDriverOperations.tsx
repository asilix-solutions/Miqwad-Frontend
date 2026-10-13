import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Dialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@shared/auth/usePermissions";
import { adminApi } from "@modules/admin/api/adminApi";
import { adminKeys } from "@modules/admin/hooks/useAdminQueries";
import { useTowTruckDrivers } from "../hooks/useTowTruckDrivers";
import type { DriverOperations } from "../hooks/useDriverOperations";
import type { TowTruckOrder } from "../lib/towTruckModel";
import {
  driverSnapshot,
  noteSchema,
  verifiedDriver,
  type DriverProposal,
} from "../lib/driverOperations";

export function TowTruckDriverOperations({
  order,
  stale,
  operations,
  onDirtyChange,
}: {
  order: TowTruckOrder;
  stale: boolean;
  operations: DriverOperations;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const { t, i18n } = useTranslation();
  const { can } = usePermissions();
  const [dialog, setDialog] = useState<"remove" | "account" | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [proposal, setProposal] = useState<DriverProposal | null>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const resultFocus = useRef<HTMLDivElement>(null);
  const wantsFocus = useRef(false);
  const form = useForm<{ note: string }>({
    resolver: zodResolver(noteSchema),
    defaultValues: { note: "" },
  });
  const { isDirty, errors } = form.formState;
  useEffect(() => {
    onDirtyChange(isDirty);
    return () => onDirtyChange(false);
  }, [isDirty, onDirtyChange]);
  const drivers = useTowTruckDrivers(page, dialog === "account" && !driverId && can("users.view"));
  const driver = useQuery({
    queryKey: adminKeys.user(driverId ?? ""),
    queryFn: () => adminApi.getUser(driverId ?? "", true),
    enabled: dialog === "account" && !!driverId && can("users.view"),
    staleTime: 0,
  });
  const account =
    driverId && driver.data && verifiedDriver(driver.data, driverId) ? driver.data : null;
  const otherOperation = operations.initialConflict();
  const disabled = operations.locked || otherOperation;
  const changed =
    proposal &&
    (proposal.kind === "remove"
      ? proposal.snapshot !== order.operationSnapshot || stale
      : !account ||
        driver.isFetching ||
        driver.isError ||
        proposal.snapshot !== driverSnapshot(account));
  useEffect(() => {
    if (wantsFocus.current && !operations.busy && resultFocus.current) {
      wantsFocus.current = false;
      resultFocus.current.focus();
    }
  }, [operations.state, operations.busy, proposal]);
  const close = () => {
    if (!operations.busy) {
      setDialog(null);
      setProposal(null);
    }
  };
  const reviewRemoval = () => {
    if (!order.driverId || stale || disabled || !operations.authorized("remove")) return;
    setProposal({
      kind: "remove",
      orderId: order.id,
      driverId: order.driverId,
      driverName: order.driverName ?? "",
      orderNumber: order.number,
      snapshot: order.operationSnapshot,
    });
  };
  const submit = async () => {
    if (!proposal || changed || disabled || !operations.authorized(proposal.kind)) return;
    wantsFocus.current = true;
    const result = await operations.submit(proposal);
    if (result.phase === "success" && proposal.kind !== "remove") form.reset();
    setProposal(null);
  };
  const recover = async () => {
    wantsFocus.current = true;
    const result = await operations.recover();
    if (result.phase === "success" && result.operation?.kind !== "remove") form.reset();
    setProposal(null);
  };
  const feedback = operations.state.message && (
    <div
      ref={resultFocus}
      tabIndex={-1}
      className="tow-assignment-result"
      data-phase={operations.state.phase}
      role={operations.state.phase === "rejected" ? "alert" : "status"}
      aria-atomic="true"
    >
      <p>{t(`towTruck.${operations.state.message}`)}</p>
      {operations.state.operation && (
        <p className="tow-hint">
          {t("towTruck.opsContext", {
            order: operations.state.operation.orderId,
            driver: operations.state.operation.driverId,
          })}
        </p>
      )}
      {operations.state.refreshFailed && (
        <p className="tow-warning">{t("towTruck.opsRejectedRefresh")}</p>
      )}
      {operations.state.financialWarning && (
        <p className="tow-warning">{t("towTruck.opsFinancialWarning")}</p>
      )}
      {["uncertain", "accepted"].includes(operations.state.phase) && operations.state.operation && (
        <Button
          variant="outline"
          disabled={!operations.authorized(operations.state.operation.kind) || otherOperation}
          onClick={() => void recover()}
        >
          {t("towTruck.checkOutcome")}
        </Button>
      )}
    </div>
  );
  return (
    <section className="tow-section" aria-labelledby="tow-driver-operations-title">
      <h3 id="tow-driver-operations-title" className="tow-section-title">
        {t("towTruck.opsTitle")}
      </h3>
      <div className="tow-driver-management-grid">
        <div>
          <h4>{t("towTruck.opsOrderAction")}</h4>
          <p className="tow-hint">{t("towTruck.opsRemoveOnly")}</p>
          {order.assignment === "assigned" ? (
            <Button
              variant="outline"
              disabled={stale || disabled || !operations.authorized("remove")}
              onClick={(event) => {
                trigger.current = event.currentTarget;
                setDialog("remove");
                reviewRemoval();
              }}
            >
              {t("towTruck.unassignDriver")}
            </Button>
          ) : (
            <p className="tow-hint">
              {t(
                `towTruck.${order.assignment === "unassigned" ? "unassigned" : "driverStateUnknown"}`,
              )}
            </p>
          )}
          {!operations.authorized("remove") && (
            <p className="tow-hint">{t("towTruck.opsOrderPermission")}</p>
          )}
        </div>
        <div>
          <h4>{t("towTruck.opsAccountTitle")}</h4>
          <p className="tow-hint">{t("towTruck.opsAccountScope")}</p>
          <Button
            variant="outline"
            disabled={!can("users.view") || operations.busy}
            onClick={(event) => {
              trigger.current = event.currentTarget;
              setDialog("account");
              if (!isDirty) setDriverId(order.driverId);
              setProposal(null);
            }}
          >
            {t("towTruck.opsManageAccounts")}
          </Button>
          {!can("users.view") && <p className="tow-hint">{t("towTruck.opsViewPermission")}</p>}
        </div>
      </div>
      {otherOperation && <p className="tow-warning">{t("towTruck.opsOtherOperation")}</p>}
      {!dialog && feedback}
      <Dialog.Root
        open={!!dialog}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="tow-driver-modal-backdrop" />
          <Dialog.Content
            className="tow-workspace tow-driver-modal"
            dir={i18n.dir()}
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              cancel.current?.focus();
            }}
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              trigger.current?.focus();
            }}
            onPointerDownOutside={(event) => event.preventDefault()}
            onEscapeKeyDown={(event) => {
              if (operations.busy) event.preventDefault();
            }}
          >
            <Dialog.Title>
              {t(
                `towTruck.${dialog === "remove" ? (order.removalPayment === "paid" ? "opsRemovePaidTitle" : "opsRemoveTitle") : "opsAccountTitle"}`,
              )}
            </Dialog.Title>
            <Dialog.Description>
              {t(
                `towTruck.${dialog === "remove" ? (order.removalPayment === "paid" ? "opsRemovePaidHint" : order.removalPayment === "pending" ? "opsRemoveHint" : "opsRemoveUnknownHint") : "opsAccountScope"}`,
              )}
            </Dialog.Description>
            {feedback}
            {proposal ? (
              <div className="tow-operation-confirmation">
                <dl className="tow-draft-summary">
                  <div>
                    <dt>{t("towTruck.selected")}</dt>
                    <dd>
                      <bdi>{proposal.orderNumber}</bdi>
                    </dd>
                  </div>
                  <div>
                    <dt>{t("towTruck.driver")}</dt>
                    <dd>
                      {proposal.driverName || t("towTruck.driverMissing")}{" "}
                      <bdi>#{proposal.driverId}</bdi>
                    </dd>
                  </div>
                  {proposal.kind === "remove" && (
                    <div>
                      <dt>{t("towTruck.payment")}</dt>
                      <dd>
                        {t(
                          `towTruck.${order.removalPayment === "paid" ? "opsPaid" : order.removalPayment === "pending" ? "paymentPending" : "paymentUnknown"}`,
                        )}
                      </dd>
                    </div>
                  )}
                </dl>
                {proposal.kind !== "remove" && (
                  <p className="tow-warning">
                    {t(
                      `towTruck.${proposal.kind === "activate" ? "opsActivateHint" : "opsDeactivateHint"}`,
                    )}
                  </p>
                )}
                {proposal.note && (
                  <p className="tow-operation-note">
                    {t("towTruck.opsReason")}: {proposal.note}
                  </p>
                )}
                {proposal.kind === "remove" && order.removalPayment !== "pending" && (
                  <label className="tow-operation-risk">
                    <input
                      type="checkbox"
                      checked={proposal.riskConfirmed ?? false}
                      disabled={operations.busy}
                      onChange={(event) =>
                        setProposal({ ...proposal, riskConfirmed: event.target.checked })
                      }
                    />
                    {t("towTruck.opsRiskConfirm")}
                  </label>
                )}
                {changed && (
                  <p className="tow-warning" role="alert">
                    {t("towTruck.opsChanged")}
                  </p>
                )}
                <div className="tow-form-actions">
                  <Button
                    variant="outline"
                    disabled={operations.busy}
                    onClick={() => setProposal(null)}
                  >
                    {t("towTruck.opsEditReview")}
                  </Button>
                  <Button
                    disabled={
                      disabled ||
                      !!changed ||
                      !operations.authorized(proposal.kind) ||
                      (proposal.kind === "remove" &&
                        order.removalPayment !== "pending" &&
                        !proposal.riskConfirmed)
                    }
                    onClick={() => void submit()}
                  >
                    {t(
                      `towTruck.${operations.busy ? "opsSending" : `opsConfirm_${proposal.kind}`}`,
                    )}
                  </Button>
                </div>
              </div>
            ) : dialog === "remove" ? (
              <Button
                variant="outline"
                disabled={
                  disabled ||
                  stale ||
                  order.assignment !== "assigned" ||
                  !operations.authorized("remove")
                }
                onClick={reviewRemoval}
              >
                {t("towTruck.opsReviewRemoval")}
              </Button>
            ) : (
              <>
                {!driverId ? (
                  <div>
                    <h4>{t("towTruck.chooseDriver")}</h4>
                    {drivers.isFetching ? (
                      <p role="status">{t("towTruck.loadingDrivers")}</p>
                    ) : drivers.isError ? (
                      <div role="alert">
                        <p>{t("towTruck.driverLoadError")}</p>
                        <Button variant="outline" onClick={() => void drivers.refetch()}>
                          {t("towTruck.retry")}
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="tow-driver-options">
                          {drivers.data?.items.map((user) => (
                            <Button
                              key={user.id}
                              variant="outline"
                              className="tow-account-choice"
                              onClick={() => {
                                setDriverId(user.id);
                                setProposal(null);
                              }}
                            >
                              {user.fullName || t("towTruck.driverMissing")} <bdi>#{user.id}</bdi>
                              <span>
                                {t(`towTruck.${user.isActive ? "opsActive" : "opsInactive"}`)}
                              </span>
                            </Button>
                          ))}
                        </div>
                        {!drivers.data?.items.length && <p>{t("towTruck.noDrivers")}</p>}
                        <nav
                          className="tow-driver-pagination"
                          aria-label={t("towTruck.driverPages")}
                        >
                          <Button
                            variant="ghost"
                            disabled={page <= 1}
                            onClick={() => setPage(page - 1)}
                          >
                            {t("towTruck.previous")}
                          </Button>
                          <span>
                            {t("towTruck.pageOf", {
                              page,
                              total: Math.max(1, drivers.data?.totalPages ?? 1),
                            })}
                          </span>
                          <Button
                            variant="ghost"
                            disabled={page >= Math.max(1, drivers.data?.totalPages ?? 1)}
                            onClick={() => setPage(page + 1)}
                          >
                            {t("towTruck.next")}
                          </Button>
                        </nav>
                      </>
                    )}
                  </div>
                ) : (
                  <div>
                    <div className="tow-form-actions">
                      <Button
                        variant="outline"
                        disabled={operations.busy || isDirty}
                        onClick={() => {
                          setDriverId(null);
                          setPage(1);
                        }}
                      >
                        {t("towTruck.changeDriver")}
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={driver.isFetching || operations.busy}
                        onClick={() => void driver.refetch()}
                      >
                        {t("towTruck.refresh")}
                      </Button>
                    </div>
                    {isDirty && <p className="tow-hint">{t("towTruck.opsReasonDraft")}</p>}
                    {driver.isFetching && <p role="status">{t("towTruck.opsLoadingAccount")}</p>}
                    {driver.isError && (
                      <p role="alert" className="tow-warning">
                        {t("towTruck.opsAccountReadFailed")}
                      </p>
                    )}
                    {!driver.isPending && !driver.isError && !account && (
                      <p role="alert">{t("towTruck.opsIdentity")}</p>
                    )}
                    {account && (
                      <>
                        <h4>
                          {account.fullName || t("towTruck.driverMissing")} <bdi>#{account.id}</bdi>
                        </h4>
                        <p>{t("towTruck.driver")}</p>
                        <p>
                          {t("towTruck.opsAccountTitle")}:{" "}
                          <strong>
                            {t(`towTruck.${account.isActive ? "opsActive" : "opsInactive"}`)}
                          </strong>
                        </p>
                        <p className="tow-hint">{t("towTruck.opsAvailability")}</p>
                        {order.driverId === account.id && (
                          <p className="tow-warning">{t("towTruck.opsAssignedAccountHint")}</p>
                        )}
                        {operations.authorized(account.isActive ? "deactivate" : "activate") ? (
                          account.isActive ? (
                            <form
                              noValidate
                              onSubmit={form.handleSubmit((values) =>
                                setProposal({
                                  kind: "deactivate",
                                  orderId: order.id,
                                  orderNumber: order.number,
                                  driverId: account.id,
                                  driverName: account.fullName,
                                  snapshot: driverSnapshot(account),
                                  note: values.note,
                                }),
                              )}
                            >
                              <label className="tow-operation-reason">
                                {t("towTruck.opsReason")}
                                <textarea
                                  {...form.register("note")}
                                  rows={3}
                                  disabled={disabled}
                                  aria-invalid={!!errors.note}
                                  aria-describedby="tow-note-error tow-note-help"
                                />
                              </label>
                              <p id="tow-note-help" className="tow-hint">
                                {t("towTruck.opsReasonHelp")}
                              </p>
                              <p id="tow-note-error" className="tow-form-error" role="alert">
                                {errors.note?.message ? t(`towTruck.${errors.note.message}`) : ""}
                              </p>
                              <Button
                                type="submit"
                                variant="outline"
                                disabled={disabled || driver.isFetching || driver.isError}
                              >
                                {t("towTruck.opsDeactivate")}
                              </Button>
                            </form>
                          ) : (
                            <Button
                              variant="outline"
                              disabled={disabled || driver.isFetching || driver.isError}
                              onClick={() =>
                                setProposal({
                                  kind: "activate",
                                  orderId: order.id,
                                  orderNumber: order.number,
                                  driverId: account.id,
                                  driverName: account.fullName,
                                  snapshot: driverSnapshot(account),
                                })
                              }
                            >
                              {t("towTruck.opsActivate")}
                            </Button>
                          )
                        ) : (
                          <p className="tow-hint">{t("towTruck.opsAccountPermission")}</p>
                        )}
                      </>
                    )}
                  </div>
                )}
              </>
            )}
            <div className="tow-form-actions">
              <Button ref={cancel} variant="outline" disabled={operations.busy} onClick={close}>
                {t(`towTruck.${operations.state.operation ? "opsClose" : "opsCancel"}`)}
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </section>
  );
}
