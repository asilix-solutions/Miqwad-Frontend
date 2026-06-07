import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User as UserIcon, Wrench } from "lucide-react";
import { AuthLayout } from "@shared/components/layout/AuthLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@shared/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@shared/components/ui/button";
import { Spinner } from "@shared/components/ui/spinner";
import { useToast } from "@shared/components/ui/toastContext";
import { cn } from "@shared/lib/utils";
import { completeProfileSchema, type CompleteProfileFormValues } from "../schemas/auth.schemas";
import { useUpdateProfileMutation } from "../hooks/useAuthMutations";

/**
 * Sprint 1 — Complete Profile.
 * Collects full name, optional email, and account type (customer / provider).
 */
export function CompleteProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const mutation = useUpdateProfileMutation();

  const form = useForm<CompleteProfileFormValues>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: { fullName: "", email: "", role: "customer" },
  });

  const selectedRole = form.watch("role");

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync({
        fullName: values.fullName,
        email: values.email || undefined,
        role: values.role,
      });
      toast.success(t("profile.saved"));
      const destination =
        values.role === "provider"
          ? "/provider/onboarding"
          : "/app/dashboard";
      navigate(destination, { replace: true });
    } catch (err) {
      toast.error(t("profile.saveFailed"), err instanceof Error ? err.message : undefined);
    }
  });

  return (
    <AuthLayout>
      <h2 className="text-2xl font-bold text-[#0F1222] text-right">
        {t("auth.profileTitle")}
      </h2>
      <p className="text-sm text-[#7A7E95] text-right mt-2">
        {t("auth.profileSub")}
      </p>

      <Card className="mt-8">
        <CardContent className="pt-6">
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <div>
              <Label htmlFor="fullName">{t("auth.fullName")}</Label>
              <Input
                id="fullName"
                autoComplete="name"
                invalid={Boolean(form.formState.errors.fullName)}
                {...form.register("fullName")}
              />
              {form.formState.errors.fullName && (
                <p className="mt-1.5 text-xs text-danger-500">
                  {t(form.formState.errors.fullName.message ?? "")}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="email">{t("auth.email")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                invalid={Boolean(form.formState.errors.email)}
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="mt-1.5 text-xs text-danger-500">
                  {t(form.formState.errors.email.message ?? "")}
                </p>
              )}
            </div>

            <div>
              <Label>{t("auth.accountType")}</Label>
              <div className="grid grid-cols-2 gap-3">
                <RoleCard
                  selected={selectedRole === "customer"}
                  onClick={() => form.setValue("role", "customer")}
                  icon={<UserIcon className="h-5 w-5" />}
                  label={t("auth.customer")}
                />
                <RoleCard
                  selected={selectedRole === "provider"}
                  onClick={() => form.setValue("role", "provider")}
                  icon={<Wrench className="h-5 w-5" />}
                  label={t("auth.provider")}
                />
              </div>
            </div>

            <Button type="submit" block disabled={mutation.isPending}>
              {mutation.isPending ? <Spinner size="sm" /> : null}
              {t("auth.save")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  );
}

function RoleCard({
  selected,
  onClick,
  icon,
  label,
}: {
  selected: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex flex-col items-center gap-2 rounded-[var(--radius-md)] border-2 bg-white p-4 transition-all",
        selected
          ? "border-brand-500 bg-brand-50 text-brand-600 shadow-[var(--shadow-1)]"
          : "border-ink-200 text-ink-700 hover:border-ink-300",
      )}
    >
      <span
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-full",
          selected ? "bg-brand-500 text-white" : "bg-ink-100 text-ink-500",
        )}
      >
        {icon}
      </span>
      <span className="text-sm font-medium font-display">{label}</span>
    </button>
  );
}
