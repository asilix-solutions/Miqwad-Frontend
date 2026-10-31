/**
 * @file TowTruckOrderWorkspacePage.tsx
 * @description Dedicated Full Order Workspace route page for Tow Truck Center.
 * Route-addressable at `/admin/tow-truck/:orderId`.
 * Provides generous width, comfortable information hierarchy, draft safety guards,
 * and seamless back navigation to preserved queue state.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  useBeforeUnload,
  useBlocker,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertCircle, ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTowTruckDetail } from "../hooks/useTowTruckQueries";
import { useDriverOperations } from "../hooks/useDriverOperations";
import { useTowTruckCancellation } from "../hooks/useTowTruckCancellation";
import { TowTruckInterCityWorkspace } from "../components/TowTruckInterCityWorkspace";
import { TowTruckIntraCityWorkspace } from "../components/TowTruckIntraCityWorkspace";
import { TowTruckUnknownServiceFallback } from "../components/TowTruckUnknownServiceFallback";
import { readFailureMessage } from "../lib/assignmentFeedback";
import { isArabicLanguage } from "@modules/vehicles/lib/modelLocalization";
import "../towTruck.css";

function WorkspaceLoading() {
  const { t } = useTranslation();
  return (
    <div className="space-y-6 animate-pulse py-4" role="status">
      <span className="sr-only">{t("towTruck.loadingDetail")}</span>
      <div className="h-28 bg-white border border-ink-200 rounded-2xl p-6" />
      <div className="h-24 bg-white border border-ink-200 rounded-2xl p-6" />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          <div className="h-64 bg-white border border-ink-200 rounded-2xl" />
          <div className="h-96 bg-white border border-ink-200 rounded-2xl" />
        </div>
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          <div className="h-48 bg-white border border-ink-200 rounded-2xl" />
          <div className="h-64 bg-white border border-ink-200 rounded-2xl" />
          <div className="h-40 bg-white border border-ink-200 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

export function TowTruckOrderWorkspacePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const isAr = isArabicLanguage(i18n.language);

  const { orderId } = useParams<{ orderId: string }>();
  const validId = !!orderId && /^[1-9]\d*$/.test(orderId) && Number.isSafeInteger(Number(orderId));

  const detail = useTowTruckDetail(validId ? orderId : undefined);
  const operations = useDriverOperations(validId ? (orderId as string) : "");
  const cancellation = useTowTruckCancellation(detail.data);

  const [assignmentDirty, setAssignmentDirty] = useState(false);
  const [assignmentBusy, setAssignmentBusy] = useState(false);
  const [accountDirty, setAccountDirty] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const dirty = assignmentDirty || accountDirty;
  const busy = assignmentBusy || operations.busy || cancellation.busy;

  const stayButton = useRef<HTMLButtonElement>(null);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      (dirty || busy) && currentLocation.pathname !== nextLocation.pathname,
  );

  useBeforeUnload(
    useCallback(
      (event) => {
        if (dirty || busy) event.preventDefault();
      },
      [dirty, busy],
    ),
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      stayButton.current?.focus();
    }
  }, [blocker.state]);

  useEffect(() => {
    if (blocker.state === "blocked" && !busy && !dirty) {
      blocker.proceed();
    }
  }, [blocker, busy, dirty]);

  const handleBackToQueue = () => {
    if (busy) return;
    const fromQueue = (location.state as { fromQueue?: string } | null)?.fromQueue;
    if (fromQueue) {
      if (fromQueue.startsWith("/")) {
        navigate(fromQueue);
      } else if (fromQueue.startsWith("?")) {
        navigate(`/admin/tow-truck${fromQueue}`);
      } else {
        navigate(fromQueue);
      }
    } else {
      navigate("/admin/tow-truck");
    }
  };

  const handleRefresh = () => {
    if (validId) {
      void detail.refetch();
    }
  };

  if (!validId) {
    return (
      <div className="tow-workspace max-w-4xl mx-auto py-12 px-4" dir={i18n.dir()}>
        <div className="rounded-2xl border border-danger-200 bg-white p-8 text-center space-y-4 shadow-sm" role="alert">
          <AlertCircle size={44} className="mx-auto text-danger-500" aria-hidden="true" />
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-ink-900">{t("towTruck.invalidOrder")}</h2>
            <p className="text-sm text-ink-500">{t("towTruck.invalidLink")}</p>
          </div>
          <Button
            variant="outline"
            onClick={handleBackToQueue}
            className="gap-2 text-xs font-semibold"
          >
            {isAr ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
            <span>{t("towTruck.backToQueue")}</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="tow-workspace space-y-6 pb-16" dir={i18n.dir()}>
      {/* Unsaved Draft Blocker Alert */}
      {blocker.state === "blocked" && (
        <div
          className="rounded-xl border border-warning-300 bg-warning-50 p-4 shadow-md flex items-center justify-between gap-4 flex-wrap"
          role="alert"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle size={20} className="text-warning-600 shrink-0" aria-hidden="true" />
            <p className="text-xs font-medium text-warning-900">
              {t(busy ? "towTruck.assignmentStay" : "towTruck.discardPrompt")}
            </p>
          </div>
          <div className="flex items-center gap-2 ms-auto">
            <Button
              ref={stayButton}
              variant="outline"
              size="sm"
              onClick={() => blocker.reset()}
              className="text-xs"
            >
              {t("towTruck.keepDraft")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={busy}
              onClick={() => {
                setAssignmentDirty(false);
                setAccountDirty(false);
                blocker.proceed();
              }}
              className="text-xs"
            >
              {t("towTruck.discardDraft")}
            </Button>
          </div>
        </div>
      )}

      {/* Uncertain Cancellation Outcome Banner */}
      {cancellation.isUncertain && (
        <div
          className="rounded-xl border border-warning-300 bg-warning-50 p-4 shadow-sm flex items-center justify-between gap-4 flex-wrap"
          role="alert"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle size={20} className="text-warning-600 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold text-warning-900">{t("towTruck.cancelUncertain")}</p>
              <p className="text-[11px] text-warning-700">{t("towTruck.cancelUncertainHint")}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => void cancellation.reconcile()}
            disabled={cancellation.busy}
            className="text-xs gap-1.5 ms-auto border-warning-400 text-warning-900 hover:bg-warning-100"
          >
            <RefreshCw size={13} className={cancellation.busy ? "animate-spin" : ""} aria-hidden="true" />
            <span>{t("towTruck.cancelReconcile")}</span>
          </Button>
        </div>
      )}

      {/* Loading State */}
      {detail.isPending ? (
        <WorkspaceLoading />
      ) : detail.isError ? (
        <div className="rounded-2xl border border-danger-200 bg-white p-8 text-center space-y-4 shadow-sm" role="alert">
          <AlertCircle size={44} className="mx-auto text-danger-500" aria-hidden="true" />
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-ink-900">{t("towTruck.errorTitle")}</h2>
            <p className="text-sm text-ink-500">{t(`towTruck.${readFailureMessage(detail.error)}`)}</p>
          </div>
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              onClick={handleBackToQueue}
              className="gap-2 text-xs font-semibold"
            >
              {isAr ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
              <span>{t("towTruck.backToQueue")}</span>
            </Button>
            <Button
              variant="default"
              onClick={handleRefresh}
              className="gap-2 text-xs font-semibold bg-brand-blue hover:bg-brand-700"
            >
              <RefreshCw size={14} />
              <span>{t("towTruck.retry")}</span>
            </Button>
          </div>
        </div>
      ) : detail.data ? (
        detail.data.serviceType === "intercity" ? (
          <TowTruckInterCityWorkspace
            order={detail.data}
            operations={operations}
            cancellation={cancellation}
            isFetching={detail.isFetching}
            stale={detail.isError || detail.isFetching}
            dataUpdatedAt={detail.dataUpdatedAt}
            onBack={handleBackToQueue}
            onRefresh={handleRefresh}
            onCancelOrder={() => setCancelDialogOpen(true)}
            cancelDialogOpen={cancelDialogOpen}
            setCancelDialogOpen={setCancelDialogOpen}
            onAssignmentDirtyChange={setAssignmentDirty}
            onAssignmentBusyChange={setAssignmentBusy}
            onAccountDirtyChange={setAccountDirty}
          />
        ) : detail.data.serviceType === "intracity" ? (
          <TowTruckIntraCityWorkspace
            order={detail.data}
            operations={operations}
            cancellation={cancellation}
            isFetching={detail.isFetching}
            stale={detail.isError || detail.isFetching}
            dataUpdatedAt={detail.dataUpdatedAt}
            onBack={handleBackToQueue}
            onRefresh={handleRefresh}
            onCancelOrder={() => setCancelDialogOpen(true)}
            cancelDialogOpen={cancelDialogOpen}
            setCancelDialogOpen={setCancelDialogOpen}
            onAssignmentDirtyChange={setAssignmentDirty}
            onAssignmentBusyChange={setAssignmentBusy}
            onAccountDirtyChange={setAccountDirty}
          />
        ) : (
          <TowTruckUnknownServiceFallback
            order={detail.data}
            cancellation={cancellation}
            isFetching={detail.isFetching}
            dataUpdatedAt={detail.dataUpdatedAt}
            onBack={handleBackToQueue}
            onRefresh={handleRefresh}
            onCancelOrder={() => setCancelDialogOpen(true)}
            cancelDialogOpen={cancelDialogOpen}
            setCancelDialogOpen={setCancelDialogOpen}
          />
        )
      ) : null}
    </div>
  );
}
