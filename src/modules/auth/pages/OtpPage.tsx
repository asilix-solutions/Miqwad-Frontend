import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight, Loader2 } from "lucide-react";
import { AuthLayout } from "@shared/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@shared/components/ui/toastContext";
import { useAppSelector } from "@app/store";
import { OtpInput } from "../components/OtpInput";
import { useResendTimer } from "../hooks/useResendTimer";
import { useRegisterMutation, useVerifyOtpMutation } from "../hooks/useAuthMutations";

/**
 * Sprint 1 — OTP verification.
 * - Reads pendingVerification from the auth slice.
 * - Renders six-digit input + resend timer.
 * - On success, navigates by user.isProfileComplete.
 */
export function OtpPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const pending = useAppSelector((s) => s.auth.pendingVerification);

  const [code, setCode] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const { seconds, reset, isFinished } = useResendTimer(pending?.resendAfter ?? 60);

  const verifyMutation = useVerifyOtpMutation();
  const registerMutation = useRegisterMutation();

  // If user lands here without an in-flight verification, send them back to /login.
  useEffect(() => {
    if (!pending) navigate("/login", { replace: true });
  }, [pending, navigate]);

  if (!pending) return null;

  const handleSubmit = async (value?: string) => {
    setSubmitError(null);
    const finalCode = value ?? code;
    if (finalCode.length !== 6) {
      setSubmitError(t("auth.invalidOtp"));
      return;
    }
    try {
      const res = await verifyMutation.mutateAsync({
        verificationId: pending.verificationId,
        code: finalCode,
      });
      if (!res.user.isProfileComplete) {
        navigate("/complete-profile", { replace: true });
      } else {
        navigate("/app/dashboard", { replace: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("auth.invalidOtp");
      setSubmitError(msg);
    }
  };

  const handleResend = async () => {
    try {
      await registerMutation.mutateAsync({ phoneNumber: pending.phoneNumber });
      reset();
      toast.info(t("auth.otpResendNow"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("errors.unknown"));
    }
  };

  /** Format seconds → mm:ss */
  const formatTime = (s: number) => {
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  };

  return (
    <AuthLayout>
      {/* Back button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="absolute top-0 right-0 w-[var(--space-10)] h-[var(--space-10)] rounded-[var(--radius-md)] bg-white shadow-[var(--shadow-card)] flex items-center justify-center"
      >
        <ChevronRight size={20} className="text-[#0F1222]" />
      </button>

      {/* Title */}
      <h2 className="txt-display-m font-main font-[var(--fw-ibm-bold)] text-[#0F1222] text-right">
        {t("auth.otpTitle")}
      </h2>

      {/* Subtitle line 1 */}
      <p className="txt-subtitle font-main text-[#7A7E95] text-right mt-[var(--space-2)]">
        {t("auth.otpSubtitle")}
      </p>

      {/* Subtitle line 2 — phone number */}
      <p className="text-[var(--color-brand-blue)] font-semibold txt-subtitle font-main text-right mt-1">
        {t("auth.countryCode")} {pending.phoneNumber}
      </p>

      {/* OTP boxes */}
      <div className="mt-[var(--space-8)]">
        <OtpInput
          length={6}
          value={code}
          onChange={(v) => {
            setCode(v);
            setSubmitError(null);
          }}
          onComplete={(v) => void handleSubmit(v)}
          invalid={Boolean(submitError)}
          disabled={verifyMutation.isPending}
          autoFocus
        />
      </div>

      {/* Error */}
      {submitError && (
        <p className="text-center text-xs text-danger-500 mt-2">{submitError}</p>
      )}

      {/* Timer */}
      {!isFinished && (
        <p className="txt-caption font-main text-[var(--color-brand-orange)] text-center mt-[var(--space-6)]">
          {t("auth.otp.resendTimer", { time: formatTime(seconds) })}
        </p>
      )}

      {/* Verify button */}
      <Button
        type="button"
        disabled={code.length !== 6 || verifyMutation.isPending}
        onClick={() => void handleSubmit()}
        block
        className="mt-[var(--space-6)]"
      >
        {verifyMutation.isPending && (
          <Loader2 size={18} className="animate-spin" />
        )}
        {t("auth.otp.verifyButton")}
      </Button>

      {/* Resend link */}
      <p className="text-center txt-caption font-main mt-[var(--space-4)]">
        <span className="text-[#7A7E95]">{t("auth.otp.didntReceive")} </span>
        <button
          type="button"
          onClick={() => void handleResend()}
          disabled={!isFinished || registerMutation.isPending}
          className={`font-[var(--fw-ibm-semibold)] ${
            isFinished
              ? "text-[var(--color-brand-orange)] hover:underline"
              : "text-[#A6AAB5] cursor-not-allowed"
          }`}
        >
          {t("auth.otp.resendLink")}
        </button>
      </p>
    </AuthLayout>
  );
}
