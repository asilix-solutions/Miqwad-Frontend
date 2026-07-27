/**
 * @file Layer 1 engine (logic half) — RHF+Zod form wired to the provider
 * signup mutation. The backend issues no token on register (the account
 * still needs email verification), so submit → create → hand off to the
 * shell's inline verify phase by exposing `registeredEmail`. Errors surface
 * as toasts; the hook itself stays silent otherwise (query/mutation hooks
 * convention).
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";
import { useToast } from "@shared/components/ui/toastContext";
import { useRegisterProviderMutation } from "../hooks/useAuthMutations";
import type { ProviderRegisterConfig, ProviderRegisterFormValues } from "./config/types";

export function useRegisterProviderForm(config: ProviderRegisterConfig) {
  const { t } = useTranslation();
  const toast = useToast();
  const mutation = useRegisterProviderMutation();
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const form = useForm<ProviderRegisterFormValues>({
    resolver: zodResolver(config.schema),
    defaultValues: {
      type: config.type,
      companyName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      termsOfServiceAccepted: false,
    },
    mode: "onSubmit",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const res = await mutation.mutateAsync({
        providerType: config.type,
        companyName: values.companyName,
        email: values.email,
        phone: values.phone,
        password: values.password,
        confirmPassword: values.confirmPassword,
        termsOfServiceAccepted: values.termsOfServiceAccepted,
      });
      setRegisteredEmail(res.email);
    } catch (err) {
      toast.error(
        t("auth.providerSignup.createFailed"),
        err instanceof Error ? err.message : undefined,
      );
    }
  });

  return { form, onSubmit, isSubmitting: mutation.isPending, registeredEmail };
}
