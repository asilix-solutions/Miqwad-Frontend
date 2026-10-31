/**
 * @file TowTruckQuickPreviewDrawer.tsx
 * @description Quick Preview Drawer for Tow Truck Center (Phase 2).
 * Enables rapid inspection of essential order details while fully preserving queue context.
 * Single-column, visually calm, legible hierarchy without embedded complex mutation forms.
 */
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Car,
  MapPin,
  Phone,
  RefreshCw,
  Truck,
  User,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { TowTruckOrder } from "../lib/towTruckModel";
import { formatTowTruckOrderDate } from "../lib/towTruckDate";
import {
  TowTruckOrderStatusBadge,
  TowTruckPaymentStatusBadge,
  TowTruckAssignmentBadge,
  TowTruckStageBadge,
  TowTruckServiceTypeBadge,
} from "./TowTruckStatusBadge";
import { TowTruckPlateDisplay } from "./TowTruckPlateDisplay";
import { nextActionMessage } from "../lib/dispatchModel";
import { isArabicLanguage } from "@modules/vehicles/lib/modelLocalization";
import { Route } from "lucide-react";

interface Props {
  open: boolean;
  order: TowTruckOrder | null | undefined;
  isLoading?: boolean;
  isError?: boolean;
  onClose: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function TowTruckQuickPreviewDrawer({
  open,
  order,
  isLoading = false,
  isError = false,
  onClose,
  onRefresh,
  isRefreshing = false,
}: Props) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const isAr = isArabicLanguage(i18n.language);

  const dateInfo = order
    ? formatTowTruckOrderDate(order.createdAt, i18n.language)
    : { valid: false, absolute: "—", relative: null, iso: null };

  const vehicleName = order
    ? ((isAr ? order.vehicleAr : order.vehicle) ?? order.vehicle)
    : null;

  const phone = order?.phone?.replace(/[\s()-]/g, "");
  const callable = phone && /^\+?\d{5,15}$/.test(phone);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent
        side="end"
        showCloseButton={false}
        className="w-full sm:max-w-md lg:max-w-lg p-0 flex flex-col h-full bg-white border-ink-200 shadow-2xl focus:outline-hidden"
        dir={i18n.dir()}
      >
        {/* Drawer Header */}
        <SheetHeader className="px-6 py-4.5 border-b border-ink-200 bg-ink-50/60 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-brand-blue/10 text-brand-blue flex items-center justify-center shrink-0">
                <Truck size={18} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <SheetTitle className="text-base font-bold text-ink-900 tracking-tight flex items-center gap-2">
                  <span>{t("towTruck.quickPreviewTitle")}</span>
                  {order && (
                    <span className="text-brand-blue font-bold text-sm bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200">
                      <bdi>{order.number}</bdi>
                    </span>
                  )}
                </SheetTitle>
                <SheetDescription className="text-xs text-ink-500 truncate mt-0.5">
                  {t("towTruck.quickPreviewSubtitle")}
                </SheetDescription>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {onRefresh && order && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-ink-500 hover:text-ink-800"
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  title={t("towTruck.refresh")}
                  aria-label={t("towTruck.refresh")}
                >
                  <RefreshCw
                    size={15}
                    className={isRefreshing ? "animate-spin" : ""}
                    aria-hidden="true"
                  />
                </Button>
              )}
              <SheetClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-ink-500 hover:text-ink-800"
                  aria-label={t("towTruck.closePreview")}
                >
                  <X size={17} aria-hidden="true" />
                </Button>
              </SheetClose>
            </div>
          </div>
        </SheetHeader>

        {/* Drawer Body - Scrollable single column */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-start text-xs text-ink-700">
          {isLoading ? (
            <div className="space-y-4 animate-pulse py-6" role="status">
              <span className="sr-only">{t("towTruck.loading")}</span>
              <div className="h-6 bg-ink-100 rounded w-1/2" />
              <div className="h-20 bg-ink-100 rounded" />
              <div className="h-28 bg-ink-100 rounded" />
              <div className="h-20 bg-ink-100 rounded" />
            </div>
          ) : isError || !order ? (
            <div className="py-12 text-center" role="alert">
              <AlertCircle size={36} className="mx-auto text-danger-500 mb-2.5" aria-hidden="true" />
              <h3 className="font-semibold text-ink-900 text-sm">{t("towTruck.orderNotFound")}</h3>
              <p className="text-xs text-ink-500 mt-1 max-w-xs mx-auto">
                {t("towTruck.orderNotFoundDesc")}
              </p>
            </div>
          ) : (
            <>
              {/* 1. Identity & Authentic Timestamp Card */}
              <div className="p-4 rounded-xl border border-ink-200 bg-ink-50/40 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-ink-500 uppercase tracking-wider">
                    {t("towTruck.orderNumber")}
                  </span>
                  <span className="text-sm font-bold text-brand-blue">
                    <bdi>{order.number}</bdi>
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs pt-1 border-t border-ink-200/60">
                  <span className="text-ink-500">{t("towTruck.created")}</span>
                  {dateInfo.valid ? (
                    <time
                      dateTime={dateInfo.iso ?? undefined}
                      title={dateInfo.absolute}
                      className="text-end font-medium text-ink-800"
                    >
                      {dateInfo.relative ? `${dateInfo.relative} · ` : ""}
                      <span className="text-ink-600">{dateInfo.absolute}</span>
                    </time>
                  ) : (
                    <span className="italic text-ink-400">{t("towTruck.missing")}</span>
                  )}
                </div>
              </div>

              {/* 2, 3, 4. Status Badges Group */}
              <div className="p-4 rounded-xl border border-ink-200 bg-white space-y-3 shadow-2xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-ink-600 font-medium">{t("towTruck.serviceType")}</span>
                  <TowTruckServiceTypeBadge serviceType={order.serviceType} />
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-ink-100">
                  <span className="text-xs text-ink-600 font-medium">{t("towTruck.orderStatus")}</span>
                  <TowTruckOrderStatusBadge status={order.status} />
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-ink-100">
                  <span className="text-xs text-ink-600 font-medium">{t("towTruck.payment")}</span>
                  <TowTruckPaymentStatusBadge paymentStatus={order.paymentStatus} />
                </div>
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-ink-100">
                  <span className="text-xs text-ink-600 font-medium">{t("towTruck.assignment")}</span>
                  <TowTruckAssignmentBadge
                    assignment={order.assignment}
                    driverName={order.driverName}
                  />
                </div>
                {order.isInterCity && order.agreedPrice !== null && (
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-ink-100">
                    <span className="text-xs text-ink-600 font-medium">{t("towTruck.intercityAgreedPrice")}</span>
                    <span className="font-bold text-sm text-brand-blue" dir="ltr">
                      {Number(order.agreedPrice).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} SAR
                    </span>
                  </div>
                )}
              </div>

              {/* 8. Next Operational Action & Stage Banner */}
              <div className="p-4 rounded-xl border border-brand-200 bg-brand-50/50 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-brand-blue flex items-center gap-1.5">
                    <AlertCircle size={14} className="shrink-0 text-brand-orange" aria-hidden="true" />
                    <span>{t("towTruck.nextAction")}</span>
                  </span>
                  <TowTruckStageBadge stage={order.stage} />
                </div>
                <p className="text-xs text-ink-700 leading-relaxed font-medium">
                  {t(`towTruck.${nextActionMessage(order)}`)}
                </p>
              </div>

              {/* 5. Concise Pickup & Destination Information */}
              <div className="p-4 rounded-xl border border-ink-200 bg-white space-y-3 shadow-2xs">
                <h4 className="text-xs font-bold text-ink-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin size={14} className="text-info-600 shrink-0" aria-hidden="true" />
                  <span>{t("towTruck.route")}</span>
                </h4>

                {order.isInterCity && order.hasInterCityRoute && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200/80 text-xs font-bold text-amber-900">
                    <Route size={14} className="text-amber-700 shrink-0" aria-hidden="true" />
                    <span>{order.routeSummary}</span>
                  </div>
                )}

                <div className="space-y-2.5 ps-1">
                  {/* Origin */}
                  <div className="flex items-start gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-info-500 mt-1 shrink-0 ring-4 ring-info-100" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <span className="block text-[11px] text-ink-500 font-medium">
                        {t("towTruck.originShort")}
                      </span>
                      <p className="font-semibold text-ink-900 text-xs mt-0.5">
                        {order.origin.title ?? order.origin.description ?? t("towTruck.missing")}
                      </p>
                      {order.origin.description && order.origin.title && (
                        <p className="text-[11px] text-ink-500 mt-0.5 line-clamp-2">
                          {order.origin.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Destination */}
                  <div className="flex items-start gap-2.5 pt-2 border-t border-ink-100">
                    <span className="w-2.5 h-2.5 rounded-[2px] bg-brand-orange mt-1 shrink-0 ring-4 ring-brand-100" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <span className="block text-[11px] text-ink-500 font-medium">
                        {t("towTruck.destination")}
                      </span>
                      <p className="font-semibold text-ink-900 text-xs mt-0.5">
                        {order.destination.title ?? order.destination.description ?? t("towTruck.missing")}
                      </p>
                      {order.destination.description && order.destination.title && (
                        <p className="text-[11px] text-ink-500 mt-0.5 line-clamp-2">
                          {order.destination.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Same Locations Alert */}
                  {order.sameLocations && (
                    <div className="flex items-center gap-1.5 text-xs text-warning-700 bg-warning-50 p-2.5 rounded-lg border border-warning-200 mt-2">
                      <AlertTriangle size={14} className="shrink-0" aria-hidden="true" />
                      <span>{t("towTruck.sameLocations")}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 6. Concise Vehicle Identification */}
              <div className="p-4 rounded-xl border border-ink-200 bg-white space-y-3 shadow-2xs">
                <h4 className="text-xs font-bold text-ink-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Car size={14} className="text-ink-600 shrink-0" aria-hidden="true" />
                  <span>{t("towTruck.vehicle")}</span>
                </h4>

                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-ink-900 text-xs">
                    {vehicleName ?? t("towTruck.vehicleMissing")}
                  </span>
                  <TowTruckPlateDisplay plate={order.plate} />
                </div>
              </div>

              {/* 7. Customer Identity & Available Contact Information */}
              <div className="p-4 rounded-xl border border-ink-200 bg-white space-y-3 shadow-2xs">
                <h4 className="text-xs font-bold text-ink-900 uppercase tracking-wider flex items-center gap-1.5">
                  <User size={14} className="text-ink-600 shrink-0" aria-hidden="true" />
                  <span>{t("towTruck.customer")}</span>
                </h4>

                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-900 text-xs">
                      {order.customer ?? t("towTruck.customerMissing")}
                    </p>
                    {order.customerId && (
                      <span className="text-[11px] text-ink-400">
                        {t("towTruck.identity")} <bdi>#{order.customerId}</bdi>
                      </span>
                    )}
                  </div>

                  {callable ? (
                    <a
                      href={`tel:${phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-brand-200 bg-brand-50 hover:bg-brand-100 text-brand-blue font-semibold text-xs transition-colors shrink-0"
                      title={t("towTruck.call")}
                    >
                      <Phone size={13} className="shrink-0" aria-hidden="true" />
                      <bdi dir="ltr">{order.phone}</bdi>
                    </a>
                  ) : order.phone ? (
                    <span className="text-xs text-ink-600 font-mono">
                      <bdi dir="ltr">{order.phone}</bdi>
                    </span>
                  ) : (
                    <span className="text-[11px] text-ink-400 italic">
                      {t("towTruck.contactMissing")}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Drawer Footer: 9. Explicit Button to Open Full Workspace */}
        {order && (
          <div className="px-6 py-4 border-t border-ink-200 bg-ink-50/70 shrink-0">
            <Button
              asChild
              className="w-full bg-brand-blue hover:bg-brand-800 text-white font-semibold min-h-[44px] shadow-sm flex items-center justify-center gap-2"
            >
              <Link
                to={`/admin/tow-truck/${order.id}`}
                state={{ fromQueue: `${location.pathname}${location.search}` }}
              >
                <span>{t("towTruck.openFullWorkspace")}</span>
                <ArrowUpRight size={16} className="rtl:rotate-270 shrink-0" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
