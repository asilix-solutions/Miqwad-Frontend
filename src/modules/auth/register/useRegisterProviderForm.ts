/**
 * @file Layer 1 engine (logic half) — RHF+Zod form wired to the provider
 * signup mutation. Submit → create → auto-login → navigate to
 * /provider/onboarding. Errors surface as toasts; the hook itself stays silent
 * otherwise (query/mutation hooks convention).
 */

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useToast } from "@shared/components/ui/toastContext";
import { useRegisterProviderMutation } from "../hooks/useAuthMutations";
import type { ProviderRegisterConfig, ProviderRegisterFormValues } from "./config/types";

export function useRegisterProviderForm(config: ProviderRegisterConfig) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const mutation = useRegisterProviderMutation();

  const form = useForm<ProviderRegisterFormValues>({
    resolver: zodResolver(config.schema),
    defaultValues: {
      type: config.type,
      companyName: "",
      email: "",
      phone: "",
      password: "",
    },
    mode: "onSubmit",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync({
        providerType: config.type,
        companyName: values.companyName,
        email: values.email,
        phone: values.phone,
        password: values.password,
      });
      navigate("/provider/onboarding", { replace: true });
    } catch (err) {
      toast.error(
        t("auth.providerSignup.createFailed"),
        err instanceof Error ? err.message : undefined,
      );
    }
  });

  return { form, onSubmit, isSubmitting: mutation.isPending };
}
