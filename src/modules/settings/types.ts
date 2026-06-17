/**
 * @file Data types for the System Settings module.
 */

export interface FeatureFlag {
  key: string;            // stable technical key, e.g. "ads_enabled"
  labelAr: string;
  labelEn: string;
  descriptionAr?: string;
  descriptionEn?: string;
  enabled: boolean;
}

export interface GeneralSettings {
  platformNameAr: string;
  platformNameEn: string;
  logoUrl?: string;
  supportEmail: string;
  supportPhone: string;
  defaultCurrency: string;   // "SAR"
  defaultLanguage: "ar" | "en";
  timezone: string;          // e.g. "Asia/Riyadh"
}

export interface ContactSettings {
  termsUrlAr?: string;
  termsUrlEn?: string;
  privacyUrlAr?: string;
  privacyUrlEn?: string;
  twitterUrl?: string;
  instagramUrl?: string;
  whatsappNumber?: string;
}

export interface SystemSettings {
  general: GeneralSettings;
  contact: ContactSettings;
  featureFlags: FeatureFlag[];
}

export type SettingsSection = "general" | "contact" | "featureFlags";
