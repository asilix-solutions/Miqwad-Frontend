import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@app/store";
import { resetRegisterDraft } from "../store/providersSlice";
import { ProviderRegisterStepper } from "../components/ProviderRegisterStepper";
import { Button } from "@/components/ui/button";

/**
 * /provider/register — entry point used both for first-time provider
 * signup AND for re-submission after a rejection.
 *
 * Approved providers are bounced to their services dashboard, since
 * the registration UI is meaningless to them.
 */
export function ProviderRegisterPage() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);

  useEffect(() => {
    if (user?.role === "provider" && user.providerStatus === "approved") {
      navigate("/provider/services", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900">
            {t("providers.registerTitle")}
          </h1>
          <p className="text-sm text-ink-500 mt-1">{t("providers.registerSubtitle")}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            dispatch(resetRegisterDraft());
            navigate("/app/dashboard");
          }}
        >
          {t("providers.backToHome")}
        </Button>
      </header>

      <ProviderRegisterStepper />
    </div>
  );
}

export default ProviderRegisterPage;
