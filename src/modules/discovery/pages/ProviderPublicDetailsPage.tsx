import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Clock,
  Star,
} from "lucide-react";
import { LoadingState } from "@shared/components/feedback/LoadingState";
import { ErrorState } from "@shared/components/feedback/ErrorState";
import { EmptyState } from "@shared/components/feedback/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@shared/components/ui/button";
import { cn } from "@shared/lib/utils";
import {
  usePublicProviderQuery,
  usePublicProviderServicesQuery,
  useProviderReviewsQuery,
} from "../hooks/useDiscoveryQueries";
import { FavoriteButton } from "../components/FavoriteButton";
import { ReviewsList } from "../components/ReviewsList";

type Tab = "services" | "reviews" | "info";

/**
 * /app/services/providers/:id — public provider profile (customer view).
 *
 * Sections:
 *  - Hero: company name + status badges + favorite button
 *  - Tabs: Services / Reviews / Info — responsive horizontal scroll
 *  - Services tab: list of all the services the provider offers
 *  - Reviews tab: average rating + review cards
 *  - Info tab: address, phone, email, working hours
 *
 * The page is fully read-only — booking will land in Sprint 5 (Orders).
 */
export function ProviderPublicDetailsPage() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const navigate = useNavigate();
  const { id: idParam } = useParams<{ id: string }>();
  const id = Number(idParam);
  const [tab, setTab] = useState<Tab>("services");

  const profileQ = usePublicProviderQuery(id);
  const servicesQ = usePublicProviderServicesQuery(id);
  const reviewsQ = useProviderReviewsQuery(id);

  if (!Number.isFinite(id) || id <= 0) {
    return (
      <EmptyState
        title={t("discovery.providerNotFound.title")}
        description={t("discovery.providerNotFound.description")}
      />
    );
  }

  if (profileQ.isLoading) return <LoadingState fullScreen={false} />;
  if (profileQ.isError || !profileQ.data) {
    return (
      <ErrorState
        title={t("discovery.errorTitle")}
        description={t("discovery.errorDescription")}
        onRetry={() => void profileQ.refetch()}
      />
    );
  }
  const p = profileQ.data;

  return (
    <div className="space-y-5 sm:space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-brand-600"
      >
        {isAr ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
        {t("discovery.backToResults")}
      </button>

      {/* Hero */}
      <section className="rounded-[var(--radius-lg)] bg-white border border-ink-200 p-5 sm:p-7">
        <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-[var(--radius-md)] bg-brand-50 text-brand-600 flex items-center justify-center font-display font-bold text-2xl shrink-0">
            {p.companyName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="font-display text-xl sm:text-2xl font-semibold text-ink-900 break-words">
                {p.companyName}
              </h1>
              {p.isVerified && (
                <Badge tone="info" size="sm">
                  <ShieldCheck className="h-3 w-3" />
                  {t("discovery.verified")}
                </Badge>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-ink-500">
              {p.city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {p.city}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-warning-500 font-semibold">
                <Star className="h-3.5 w-3.5 fill-current" />
                {p.rating > 0 ? p.rating.toFixed(1) : t("discovery.noRating")}
                {p.totalRatings > 0 && (
                  <span className="text-ink-400 font-normal">
                    ({p.totalRatings})
                  </span>
                )}
              </span>
              {p.workingHours && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {p.workingHours}
                </span>
              )}
            </div>
          </div>

          <div className="flex gap-2 ms-auto">
            <FavoriteButton providerId={p.id} variant="labeled" />
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="border-b border-ink-200 overflow-x-auto">
        <div className="flex min-w-max">
          <TabBtn active={tab === "services"} onClick={() => setTab("services")}>
            {t("discovery.tabs.services")}
            {servicesQ.data && (
              <span className="ms-1 text-xs text-ink-400">({servicesQ.data.length})</span>
            )}
          </TabBtn>
          <TabBtn active={tab === "reviews"} onClick={() => setTab("reviews")}>
            {t("discovery.tabs.reviews")}
            {reviewsQ.data && (
              <span className="ms-1 text-xs text-ink-400">({reviewsQ.data.total})</span>
            )}
          </TabBtn>
          <TabBtn active={tab === "info"} onClick={() => setTab("info")}>
            {t("discovery.tabs.info")}
          </TabBtn>
        </div>
      </div>

      {/* Tab content */}
      {tab === "services" && (
        <section>
          {servicesQ.isLoading && <LoadingState />}
          {servicesQ.isError && (
            <ErrorState onRetry={() => void servicesQ.refetch()} />
          )}
          {servicesQ.data && servicesQ.data.length === 0 && (
            <EmptyState
              title={t("discovery.services.empty.title")}
              description={t("discovery.services.empty.description")}
            />
          )}
          {servicesQ.data && servicesQ.data.length > 0 && (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {servicesQ.data.map((s) => (
                <li
                  key={s.id}
                  className="rounded-[var(--radius-md)] border border-ink-200 bg-white p-4 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-semibold text-ink-900 truncate">
                        {s.name}
                      </p>
                      {s.categoryName && (
                        <p className="text-xs text-ink-500 mt-0.5">{s.categoryName}</p>
                      )}
                    </div>
                    <div className="text-end shrink-0">
                      <p className="font-display text-lg font-bold text-brand-600">
                        {t("common.priceSar", { amount: s.price })}
                      </p>
                      {s.estimatedDuration != null && (
                        <p className="text-xs text-ink-500">
                          {t("discovery.duration", { mins: s.estimatedDuration })}
                        </p>
                      )}
                    </div>
                  </div>
                  {s.description && (
                    <p className="text-sm text-ink-600 leading-relaxed">{s.description}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "reviews" && (
        <section>
          {reviewsQ.isLoading && <LoadingState />}
          {reviewsQ.isError && (
            <ErrorState onRetry={() => void reviewsQ.refetch()} />
          )}
          {reviewsQ.data && <ReviewsList data={reviewsQ.data} />}
        </section>
      )}

      {tab === "info" && (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <InfoRow icon={<Phone className="h-4 w-4" />} label={t("discovery.info.phone")}>
            <a href={`tel:${p.phone}`} className="text-brand-600 hover:underline">
              {p.phone}
            </a>
          </InfoRow>
          <InfoRow icon={<Mail className="h-4 w-4" />} label={t("discovery.info.email")}>
            <a href={`mailto:${p.email}`} className="text-brand-600 hover:underline break-all">
              {p.email}
            </a>
          </InfoRow>
          {p.address && (
            <InfoRow icon={<MapPin className="h-4 w-4" />} label={t("discovery.info.address")}>
              {p.address}
            </InfoRow>
          )}
          {p.workingHours && (
            <InfoRow icon={<Clock className="h-4 w-4" />} label={t("discovery.info.workingHours")}>
              {p.workingHours}
            </InfoRow>
          )}
        </section>
      )}

      {/* CTA — "book now" stub for Sprint 5 */}
      <div className="rounded-[var(--radius-lg)] bg-brand-50 border border-brand-200 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <p className="font-display font-semibold text-brand-700">
            {t("discovery.cta.title")}
          </p>
          <p className="text-sm text-brand-600/80">{t("discovery.cta.subtitle")}</p>
        </div>
        <Button disabled title={t("discovery.cta.comingSoon")}>
          {t("discovery.cta.button")}
        </Button>
      </div>
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "px-4 sm:px-5 h-11 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
        active
          ? "text-brand-600 border-brand-500"
          : "text-ink-500 border-transparent hover:text-ink-900",
      )}
    >
      {children}
    </button>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-ink-200 bg-white p-4 flex items-start gap-3">
      <div className="h-9 w-9 rounded-full bg-ink-100 text-ink-700 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wide text-ink-500">{label}</p>
        <div className="text-sm text-ink-900 break-words">{children}</div>
      </div>
    </div>
  );
}
