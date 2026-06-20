import { useTranslation } from "react-i18next";
import { Package, ShoppingCart, TrendingUp, Wallet } from "lucide-react";
import { useMyProviderProfileQuery } from "@modules/providers/hooks/useProviderQueries";
import { useAppSelector } from "@app/store";

export function DealerDashboardPage() {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);
  const { data: myProfile } = useMyProviderProfileQuery();

  const companyName = myProfile?.companyName || user?.fullName || "";

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-ink-900">
          {t("dealer.dashboard.greeting", { defaultValue: "مرحباً، {{name}}", name: companyName })}
        </h1>
        <p className="text-ink-500">
          {t("dealer.dashboard.title", { defaultValue: "نظرة عامة على أداء المتجر" })}
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Products KPI */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-[var(--radius-md)] p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-brand-50 text-brand-600">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-ink-600">
              {t("dealer.dashboard.kpiProducts", { defaultValue: "المنتجات" })}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-bold text-ink-900">—</span>
            <span className="text-xs text-ink-400">
              {t("dealer.dashboard.comingSoon", { defaultValue: "قريباً" })}
            </span>
          </div>
        </div>

        {/* Open Orders KPI */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-[var(--radius-md)] p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-ink-600">
              {t("dealer.dashboard.kpiOpenOrders", { defaultValue: "الطلبات المفتوحة" })}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-bold text-ink-900">—</span>
            <span className="text-xs text-ink-400">
              {t("dealer.dashboard.comingSoon", { defaultValue: "قريباً" })}
            </span>
          </div>
        </div>

        {/* Monthly Sales KPI */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-[var(--radius-md)] p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-50 text-green-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-ink-600">
              {t("dealer.dashboard.kpiMonthlySales", { defaultValue: "مبيعات الشهر" })}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-bold text-ink-900">—</span>
            <span className="text-xs text-ink-400">
              {t("dealer.dashboard.comingSoon", { defaultValue: "قريباً" })}
            </span>
          </div>
        </div>

        {/* Outstanding Dues KPI */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-[var(--radius-md)] p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-50 text-orange-600">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium text-ink-600">
              {t("dealer.dashboard.kpiOutstandingDues", { defaultValue: "المستحقات" })}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-2xl font-bold text-ink-900">—</span>
            <span className="text-xs text-ink-400">
              {t("dealer.dashboard.comingSoon", { defaultValue: "قريباً" })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
