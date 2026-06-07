import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Camera, Mail, Phone as PhoneIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Button } from "@shared/components/ui/button";
import { Spinner } from "@shared/components/ui/spinner";
import { useToast } from "@shared/components/ui/toastContext";
import { LoadingState } from "@shared/components/feedback/LoadingState";
import { ErrorState } from "@shared/components/feedback/ErrorState";
import { useAppSelector } from "@app/store";
import { authApi } from "../api/authApi";
import { completeProfileSchema, type CompleteProfileFormValues } from "../schemas/auth.schemas";
import { useUpdateProfileMutation } from "../hooks/useAuthMutations";

/**
 * Sprint 1 — Profile page.
 *
 * Architecture:
 *   - GET /users/me through TanStack Query (loading/error states built in).
 *   - PUT /users/me through the shared mutation hook (writes back into Redux).
 *   - Avatar upload triggers POST /users/me/avatar; we re-fetch /me on success.
 */
export function ProfilePage() {
  const { t } = useTranslation();
  const toast = useToast();
  const cachedUser = useAppSelector((s) => s.auth.user);
  const mutation = useUpdateProfileMutation();

  const meQuery = useQuery({
    queryKey: ["user", "me"],
    queryFn: () => authApi.me(),
    initialData: cachedUser ?? undefined,
  });

  const form = useForm<CompleteProfileFormValues>({
    resolver: zodResolver(completeProfileSchema),
    defaultValues: {
      fullName: meQuery.data?.fullName ?? "",
      email: meQuery.data?.email ?? "",
      role: (meQuery.data?.role === "customer" || meQuery.data?.role === "provider")
        ? meQuery.data.role
        : "customer",
    },
  });

  useEffect(() => {
    if (meQuery.data) {
      form.reset({
        fullName: meQuery.data.fullName,
        email: meQuery.data.email ?? "",
        role: meQuery.data.role === "provider" ? "provider" : "customer",
      });
    }
  }, [meQuery.data, form]);

  if (meQuery.isLoading) return <LoadingState />;
  if (meQuery.isError || !meQuery.data) {
    return <ErrorState onRetry={() => void meQuery.refetch()} />;
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync({
        fullName: values.fullName,
        email: values.email || undefined,
        role: values.role,
      });
      toast.success(t("profile.saved"));
      await meQuery.refetch();
    } catch (err) {
      toast.error(t("profile.saveFailed"), err instanceof Error ? err.message : undefined);
    }
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await authApi.uploadAvatar(file);
      toast.success(t("profile.saved"));
      await meQuery.refetch();
    } catch (err) {
      toast.error(t("profile.saveFailed"), err instanceof Error ? err.message : undefined);
    }
  };

  const user = meQuery.data;
  const initial = user.fullName?.trim().charAt(0) || "م";

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-5">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-500 text-white text-2xl font-display font-semibold shadow-[var(--shadow-1)]">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName} className="h-full w-full rounded-full object-cover" />
                ) : (
                  initial
                )}
              </div>
              <label
                htmlFor="avatar"
                className="absolute -bottom-1 -end-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white border border-ink-200 shadow-[var(--shadow-1)] hover:bg-ink-50"
                aria-label={t("profile.editAvatar")}
              >
                <Camera className="h-4 w-4 text-ink-700" />
              </label>
              <input id="avatar" type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold text-ink-900 truncate">
                {user.fullName || "—"}
              </h2>
              <div className="mt-1 flex items-center gap-3 text-sm text-ink-500">
                <span className="flex items-center gap-1.5">
                  <PhoneIcon className="h-4 w-4" />
                  +966 {user.phoneNumber}
                </span>
                {user.email && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-4 w-4" />
                    {user.email}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("profile.title")}</CardTitle>
          <CardDescription>{t("auth.profileSub")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5" noValidate>
            <div className="md:col-span-2">
              <Label htmlFor="p-fullName">{t("auth.fullName")}</Label>
              <Input
                id="p-fullName"
                invalid={Boolean(form.formState.errors.fullName)}
                {...form.register("fullName")}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="p-email">{t("auth.email")}</Label>
              <Input
                id="p-email"
                type="email"
                invalid={Boolean(form.formState.errors.email)}
                {...form.register("email")}
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 pt-2 border-t border-ink-100">
              <Button type="submit" disabled={mutation.isPending || !form.formState.isDirty}>
                {mutation.isPending ? <Spinner size="sm" /> : null}
                {t("common.save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
