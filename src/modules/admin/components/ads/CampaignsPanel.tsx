/**
 * @file CampaignsPanel.tsx
 * @description Panel displaying a list of ad campaigns with filters and actions.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useCampaignsQuery, usePlacementsQuery } from "../../hooks/useAdminQueries";
import { DataTable } from "../shared/DataTable";
import { Can } from "@shared/auth/Can";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "../shared/StatusBadge";
import { formatDate } from "@shared/lib/formatDate";
import { cn } from "@shared/lib/utils";
import type { AdCampaign } from "@modules/ads/types";
import { DeleteCampaignDialog } from "./DeleteCampaignDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CampaignsPanel() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [placementFilter, setPlacementFilter] = useState<string>("all");
  const [deleteDialogCampaign, setDeleteDialogCampaign] = useState<AdCampaign | null>(null);

  const { data: campaignsResponse, isLoading, error } = useCampaignsQuery({
    page: 1,
    pageSize: 50,
    status: statusFilter === "all" ? undefined : statusFilter,
    placementId: placementFilter === "all" ? undefined : Number(placementFilter),
  });

  const { data: placements } = usePlacementsQuery({ isActive: true });

  const columns = [
    {
      key: "title",
      header: t("superAdmin.ads.columns.title"),
      render: (row: AdCampaign) => {
        const title = i18n.language === "ar" ? row.titleAr : row.titleEn;
        return (
          <span className={cn("font-medium", row.status === "ended" && "text-[var(--color-muted)]")}>
            {title}
          </span>
        );
      },
    },
    {
      key: "placement",
      header: t("superAdmin.ads.columns.placement"),
      render: (row: AdCampaign) => {
        const placement = placements?.find((p) => p.id === row.placementId);
        if (!placement) return <span className="text-[var(--color-muted)]">—</span>;
        return i18n.language === "ar" ? placement.nameAr : placement.nameEn;
      },
    },
    {
      key: "period",
      header: t("superAdmin.ads.columns.period"),
      render: (row: AdCampaign) => (
        <div dir="ltr" className="text-sm tabular-nums text-[var(--color-muted)] inline-block">
          {formatDate(row.startsAt, i18n.language)} - {formatDate(row.endsAt, i18n.language)}
        </div>
      ),
    },
    {
      key: "status",
      header: t("superAdmin.ads.columns.status"),
      render: (row: AdCampaign) => <StatusBadge kind="campaign" status={row.status} />,
    },
    {
      key: "actions",
      header: t("superAdmin.ads.columns.actions"),
      className: "text-end",
      render: (row: AdCampaign) => (
        <div className="flex justify-end gap-2">
          <Can permission="ads.edit">
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] rounded-[var(--radius-md)]"
              onClick={() => navigate(`/admin/ads/campaigns/${row.id}`)}
            >
              <Pencil size={16} />
            </Button>
          </Can>
          <Can permission="ads.delete">
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-danger-500 hover:bg-[var(--color-surface-2)] rounded-[var(--radius-md)]"
              onClick={() => setDeleteDialogCampaign(row)}
            >
              <Trash2 size={16} />
            </Button>
          </Can>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter} dir="rtl">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("superAdmin.ads.filters.allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("superAdmin.ads.filters.allStatuses")}</SelectItem>
              <SelectItem value="draft">{t("superAdmin.ads.status.draft")}</SelectItem>
              <SelectItem value="scheduled">{t("superAdmin.ads.status.scheduled")}</SelectItem>
              <SelectItem value="active">{t("superAdmin.ads.status.active")}</SelectItem>
              <SelectItem value="paused">{t("superAdmin.ads.status.paused")}</SelectItem>
              <SelectItem value="ended">{t("superAdmin.ads.status.ended")}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={placementFilter} onValueChange={setPlacementFilter} dir="rtl">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder={t("superAdmin.ads.filters.allPlacements")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("superAdmin.ads.filters.allPlacements")}</SelectItem>
              {placements?.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {i18n.language === "ar" ? p.nameAr : p.nameEn}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Can permission="ads.create">
          <Button
            variant="default"
            className="gap-2 bg-[var(--color-brand-blue)] hover:bg-[var(--color-brand-blue)]/90 text-white"
            onClick={() => navigate("/admin/ads/campaigns/new")}
          >
            <Plus size={18} />
            {t("superAdmin.ads.campaigns.add")}
          </Button>
        </Can>
      </div>

      <div className="rounded-md border border-[var(--color-divider)] bg-white shadow-sm">
        <DataTable<AdCampaign>
          rows={campaignsResponse?.items ?? []}
          columns={columns}
          isLoading={isLoading}
          isError={!!error}
          getRowKey={(row) => String(row.id)}
          emptyText={t("superAdmin.ads.campaigns.empty")}
        />
      </div>

      {deleteDialogCampaign && (
        <DeleteCampaignDialog
          campaign={deleteDialogCampaign}
          open={!!deleteDialogCampaign}
          onOpenChange={(open: boolean) => !open && setDeleteDialogCampaign(null)}
        />
      )}
    </div>
  );
}
