/**
 * @file Data types for the Ads module (Campaigns and Placements).
 */

export type AdCampaignStatus = "draft" | "scheduled" | "active" | "paused" | "ended";

export interface AdPlacement {
  id: number;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  isActive: boolean;
}

export interface AdCampaign {
  id: number;
  titleAr: string;
  titleEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  imageUrl?: string;
  targetUrl?: string;
  placementId: number;
  startsAt: string;
  endsAt: string;
  status: AdCampaignStatus;
  priority?: number;
  createdAt: string;
}
