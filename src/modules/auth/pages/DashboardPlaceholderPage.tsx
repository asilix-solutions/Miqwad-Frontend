import { Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppSelector } from "@app/store";
import { Card, CardContent } from "@shared/components/ui/card";
import { EmptyState } from "@shared/components/feedback/EmptyState";

/**
 * Placeholder home that lives inside the authenticated shell.
 * Subsequent sprints (Vehicles, Orders, ...) will replace this.
 */
export function DashboardPlaceholderPage() {
  const { t } = useTranslation();
  const user = useAppSelector((s) => s.auth.user);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-brand-50 text-brand-500">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold text-ink-900">
                {t("auth.welcome")}
                {user?.fullName ? `، ${user.fullName}` : ""}
              </h1>
              {/* <p className="text-sm text-ink-500 mt-1">
                Sprint 0 و Sprint 1 جاهزان. الوحدات القادمة (المركبات، مقدّمو الخدمة، الطلبات…) ستتفعّل في السبرنتات اللاحقة.
              </p> */}
            </div>
          </div>
        </CardContent>
      </Card>

      <EmptyState
        title="ابدأ رحلتك مع مقود"
        description="من هنا ستظهر اختصارات الطلبات الأخيرة، مركباتك، والإشعارات الفعّالة."
      />
    </div>
  );
}
