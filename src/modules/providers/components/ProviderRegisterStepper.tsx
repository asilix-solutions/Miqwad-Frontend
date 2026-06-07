import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Stepper } from "@shared/components/ui/stepper";
import { useToast } from "@shared/components/ui/toastContext";
import { useAppDispatch, useAppSelector } from "@app/store";
import { setUser } from "@modules/auth/store/authSlice";
import {
  patchCompany,
  patchLocation,
  setDraftCategories,
  setDraftDocuments,
  setRegisterStep,
  resetRegisterDraft,
} from "../store/providersSlice";
import { useRegisterProviderMutation } from "../hooks/useProviderMutations";
import { RegisterStepCompany } from "./RegisterStepCompany";
import { RegisterStepLocation } from "./RegisterStepLocation";
import { RegisterStepServices } from "./RegisterStepServices";
import { RegisterStepDocuments } from "./RegisterStepDocuments";
import { RegisterStepReview } from "./RegisterStepReview";

/**
 * Orchestrates the 5-step provider registration flow.
 *
 * Step state and draft values live in Redux so:
 *   - the user can navigate to an earlier step without losing data
 *   - a page refresh during onboarding keeps progress (state survives
 *     because Redux is rehydrated from the same store)
 *   - logout cleanly resets the draft (extraReducers in providersSlice)
 */
const STEPS = [
  { label: "providers.steps.company" },
  { label: "providers.steps.location" },
  { label: "providers.steps.services" },
  { label: "providers.steps.documents" },
  { label: "providers.steps.review" },
] as const;

export function ProviderRegisterStepper() {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  const currentStep = useAppSelector((s) => s.providers.currentStep);
  const draft = useAppSelector((s) => s.providers.registerDraft);
  const user = useAppSelector((s) => s.auth.user);

  const registerMutation = useRegisterProviderMutation();

  const stepLabels = STEPS.map((s) => ({ label: t(s.label) }));

  const goTo = (i: number) => dispatch(setRegisterStep(i));

  const handleSubmit = async () => {
    if (!draft.company.companyName || !draft.company.email || !draft.company.phone) {
      // Defensive: shouldn't happen — Zod blocks earlier — but jump back.
      goTo(0);
      return;
    }
    try {
      const profile = await registerMutation.mutateAsync({
        companyName: draft.company.companyName,
        email: draft.company.email,
        phone: draft.company.phone,
        password: draft.company.password ?? "",
        lat: draft.location.lat ?? null,
        lng: draft.location.lng ?? null,
        address: draft.location.address || undefined,
        city: draft.location.city || undefined,
        workingHours: draft.location.workingHours || undefined,
        categoryIds: draft.categoryIds,
        documents: draft.documents.map((d) => ({
          type: d.type,
          fileName: d.fileName,
          fileSize: d.fileSize,
        })),
      });

      // Mirror role/status on the user blob so guards immediately react.
      if (user) {
        dispatch(
          setUser({
            ...user,
            role: "provider",
            providerId: profile.id,
            providerStatus: profile.status,
            providerRejectionReason: profile.rejectionReason ?? null,
          }),
        );
      }

      toast.success(t("providers.registerSuccess"));
      dispatch(resetRegisterDraft());
      navigate("/provider/pending", { replace: true });
    } catch {
      toast.error(t("providers.registerFailed"));
    }
  };

  return (
    <div className="space-y-6">
      <Stepper steps={stepLabels} currentStep={currentStep} onStepClick={goTo} />

      <div className="rounded-[var(--radius-lg)] bg-white border border-ink-200 p-4 sm:p-6">
        {currentStep === 0 && (
          <RegisterStepCompany
            defaultValues={draft.company}
            onCancel={() => navigate(-1)}
            onNext={(values) => {
              dispatch(patchCompany(values));
              goTo(1);
            }}
          />
        )}
        {currentStep === 1 && (
          <RegisterStepLocation
            defaultValues={draft.location}
            onBack={() => goTo(0)}
            onNext={(values) => {
              dispatch(patchLocation(values));
              goTo(2);
            }}
          />
        )}
        {currentStep === 2 && (
          <RegisterStepServices
            defaultValues={draft.categoryIds}
            onBack={() => goTo(1)}
            onNext={(ids) => {
              dispatch(setDraftCategories(ids));
              goTo(3);
            }}
          />
        )}
        {currentStep === 3 && (
          <RegisterStepDocuments
            value={draft.documents}
            onChange={(docs) => dispatch(setDraftDocuments(docs))}
            onBack={() => goTo(2)}
            onNext={() => goTo(4)}
          />
        )}
        {currentStep === 4 && (
          <RegisterStepReview
            draft={draft}
            onBack={() => goTo(3)}
            onSubmit={handleSubmit}
            submitting={registerMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
