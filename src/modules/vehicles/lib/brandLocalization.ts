/**
 * @file brandLocalization.ts
 * @description Centralized bilingual brand localization, English alias dictionary,
 * Arabic normalization, and resilient brand search for Miqwad Admin & Vehicles.
 *
 * Covers all 40 verified live catalog vehicle brands.
 * Preserves canonical backend brand names and numeric brand IDs.
 * Does NOT invent API fields (no `nameEn` on Brand DTO).
 */
import i18n from "@app/i18n";
import type { Brand } from "../types";

export interface BrandLocalizationEntry {
  readonly id: number;
  readonly canonicalArabic: string;
  readonly primaryEnglish: string;
  readonly aliases: readonly string[];
}

/**
 * 40 verified live catalog brands in Miqwad.
 * Mapped by stable backend brandId.
 */
export const BRAND_LOCALIZATION_CATALOG: Readonly<Record<number, BrandLocalizationEntry>> = {
  9: {
    id: 9,
    canonicalArabic: "تويوتا",
    primaryEnglish: "Toyota",
    aliases: ["toyota"],
  },
  10: {
    id: 10,
    canonicalArabic: "لكزس",
    primaryEnglish: "Lexus",
    aliases: ["lexus"],
  },
  11: {
    id: 11,
    canonicalArabic: "نيسان",
    primaryEnglish: "Nissan",
    aliases: ["nissan"],
  },
  12: {
    id: 12,
    canonicalArabic: "إنفينيتي",
    primaryEnglish: "Infiniti",
    aliases: ["infiniti"],
  },
  13: {
    id: 13,
    canonicalArabic: "هوندا",
    primaryEnglish: "Honda",
    aliases: ["honda"],
  },
  14: {
    id: 14,
    canonicalArabic: "أكورا",
    primaryEnglish: "Acura",
    aliases: ["acura"],
  },
  15: {
    id: 15,
    canonicalArabic: "مازدا",
    primaryEnglish: "Mazda",
    aliases: ["mazda"],
  },
  16: {
    id: 16,
    canonicalArabic: "ميتسوبيشي",
    primaryEnglish: "Mitsubishi",
    aliases: ["mitsubishi"],
  },
  17: {
    id: 17,
    canonicalArabic: "سوزوكي",
    primaryEnglish: "Suzuki",
    aliases: ["suzuki"],
  },
  18: {
    id: 18,
    canonicalArabic: "سوبارو",
    primaryEnglish: "Subaru",
    aliases: ["subaru"],
  },
  19: {
    id: 19,
    canonicalArabic: "هيونداي",
    primaryEnglish: "Hyundai",
    aliases: ["hyundai"],
  },
  20: {
    id: 20,
    canonicalArabic: "كيا",
    primaryEnglish: "Kia",
    aliases: ["kia"],
  },
  21: {
    id: 21,
    canonicalArabic: "جينيسيس",
    primaryEnglish: "Genesis",
    aliases: ["genesis"],
  },
  22: {
    id: 22,
    canonicalArabic: "فورد",
    primaryEnglish: "Ford",
    aliases: ["ford"],
  },
  23: {
    id: 23,
    canonicalArabic: "شيفروليه",
    primaryEnglish: "Chevrolet",
    aliases: ["chevrolet", "chevy"],
  },
  24: {
    id: 24,
    canonicalArabic: "جي إم سي",
    primaryEnglish: "GMC",
    aliases: ["gmc"],
  },
  25: {
    id: 25,
    canonicalArabic: "كاديلاك",
    primaryEnglish: "Cadillac",
    aliases: ["cadillac"],
  },
  26: {
    id: 26,
    canonicalArabic: "دودج",
    primaryEnglish: "Dodge",
    aliases: ["dodge", "ram"],
  },
  27: {
    id: 27,
    canonicalArabic: "جيب",
    primaryEnglish: "Jeep",
    aliases: ["jeep"],
  },
  28: {
    id: 28,
    canonicalArabic: "كرايسلر",
    primaryEnglish: "Chrysler",
    aliases: ["chrysler"],
  },
  29: {
    id: 29,
    canonicalArabic: "بي إم دبليو",
    primaryEnglish: "BMW",
    aliases: ["bmw"],
  },
  30: {
    id: 30,
    canonicalArabic: "مرسيدس بنز",
    primaryEnglish: "Mercedes-Benz",
    aliases: ["mercedes-benz", "mercedes", "benz"],
  },
  31: {
    id: 31,
    canonicalArabic: "أودي",
    primaryEnglish: "Audi",
    aliases: ["audi"],
  },
  32: {
    id: 32,
    canonicalArabic: "فولكس فاجن",
    primaryEnglish: "Volkswagen",
    aliases: ["volkswagen", "vw"],
  },
  33: {
    id: 33,
    canonicalArabic: "بورش",
    primaryEnglish: "Porsche",
    aliases: ["porsche"],
  },
  34: {
    id: 34,
    canonicalArabic: "فولفو",
    primaryEnglish: "Volvo",
    aliases: ["volvo"],
  },
  35: {
    id: 35,
    canonicalArabic: "لاند روفر",
    primaryEnglish: "Land Rover",
    aliases: ["land rover", "range rover"],
  },
  36: {
    id: 36,
    canonicalArabic: "جاكوار",
    primaryEnglish: "Jaguar",
    aliases: ["jaguar"],
  },
  37: {
    id: 37,
    canonicalArabic: "ميني",
    primaryEnglish: "Mini",
    aliases: ["mini", "mini cooper"],
  },
  38: {
    id: 38,
    canonicalArabic: "بنتلي",
    primaryEnglish: "Bentley",
    aliases: ["bentley"],
  },
  39: {
    id: 39,
    canonicalArabic: "رولز رويس",
    primaryEnglish: "Rolls-Royce",
    aliases: ["rolls-royce", "rolls royce"],
  },
  40: {
    id: 40,
    canonicalArabic: "فيراري",
    primaryEnglish: "Ferrari",
    aliases: ["ferrari"],
  },
  41: {
    id: 41,
    canonicalArabic: "لامبورغيني",
    primaryEnglish: "Lamborghini",
    aliases: ["lamborghini"],
  },
  42: {
    id: 42,
    canonicalArabic: "مازيراتي",
    primaryEnglish: "Maserati",
    aliases: ["maserati"],
  },
  43: {
    id: 43,
    canonicalArabic: "بي واي دي",
    primaryEnglish: "BYD",
    aliases: ["byd"],
  },
  44: {
    id: 44,
    canonicalArabic: "جيلي",
    primaryEnglish: "Geely",
    aliases: ["geely"],
  },
  45: {
    id: 45,
    canonicalArabic: "شيري",
    primaryEnglish: "Chery",
    aliases: ["chery"],
  },
  46: {
    id: 46,
    canonicalArabic: "شانجان",
    primaryEnglish: "Changan",
    aliases: ["changan"],
  },
  47: {
    id: 47,
    canonicalArabic: "هافال",
    primaryEnglish: "Haval",
    aliases: ["haval"],
  },
  48: {
    id: 48,
    canonicalArabic: "إم جي",
    primaryEnglish: "MG",
    aliases: ["mg"],
  },
};

/**
 * Secondary mapping: normalized Arabic brand name -> brandId.
 * Provides fallback lookup when brandId is missing or unmapped.
 */
export const ARABIC_NAME_TO_BRAND_ID: Readonly<Record<string, number>> = Object.entries(
  BRAND_LOCALIZATION_CATALOG,
).reduce<Record<string, number>>((acc, [idStr, entry]) => {
  acc[normalizeArabic(entry.canonicalArabic)] = Number(idStr);
  return acc;
}, {});

/**
 * Normalizes an Arabic string for resilient searching and comparison:
 * - Strips diacritics (tashkeel: َ, ُ, ِ, ْ, ّ, ً, ٌ, ٍ)
 * - Strips tatweel (ـ)
 * - Normalizes Alef variations (أ, إ, آ, ٱ -> ا)
 * - Normalizes Taa Marbuta (ة -> ه)
 * - Normalizes Yaa (ى -> ي)
 * - Trims and collapses multiple spaces
 */
export function normalizeArabic(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks whether the specified language (or active i18n language) is Arabic.
 */
export function isArabicLanguage(lang?: string): boolean {
  const active = lang ?? i18n.language ?? "ar";
  return active.startsWith("ar");
}

/**
 * Resolves the primary English name for a brand by numeric ID or Arabic name.
 * Never throws; returns undefined if unmapped.
 */
export function getBrandEnglishName(brandId?: number | null, brandName?: string | null): string | undefined {
  if (brandId != null && brandId > 0) {
    const entry = BRAND_LOCALIZATION_CATALOG[brandId];
    if (entry) return entry.primaryEnglish;
  }

  if (brandName) {
    const norm = normalizeArabic(brandName);
    const resolvedId = ARABIC_NAME_TO_BRAND_ID[norm];
    if (resolvedId && BRAND_LOCALIZATION_CATALOG[resolvedId]) {
      return BRAND_LOCALIZATION_CATALOG[resolvedId].primaryEnglish;
    }
  }

  return undefined;
}

/**
 * Returns all recognized search aliases (lowercase) for a brand.
 */
export function getBrandAliases(brandId?: number | null, brandName?: string | null): readonly string[] {
  if (brandId != null && brandId > 0) {
    const entry = BRAND_LOCALIZATION_CATALOG[brandId];
    if (entry) return entry.aliases;
  }

  if (brandName) {
    const norm = normalizeArabic(brandName);
    const resolvedId = ARABIC_NAME_TO_BRAND_ID[norm];
    if (resolvedId && BRAND_LOCALIZATION_CATALOG[resolvedId]) {
      return BRAND_LOCALIZATION_CATALOG[resolvedId].aliases;
    }
  }

  return [];
}

/**
 * Resolves the display name for a brand based on active language.
 * In Arabic mode: returns the stored canonical Arabic name.
 * In English mode: returns the primary English name if mapped, or falls back to stored name.
 */
export function getBrandDisplayName(
  brand: { id: number; name: string } | null | undefined,
  lang?: string,
): string {
  if (!brand) return "";
  const isAr = isArabicLanguage(lang);

  if (isAr) {
    return brand.name;
  }

  const en = getBrandEnglishName(brand.id, brand.name);
  return en ?? brand.name;
}

/**
 * Checks whether a Brand record matches a search term across:
 * 1. Stored Arabic brand name (substring match)
 * 2. Normalized Arabic brand name (handles alef/yaa/taa marbuta variations)
 * 3. Primary English brand name (case-insensitive substring)
 * 4. Recognized English aliases (e.g. BMW, VW, Chevy, Ram, Benz)
 *
 * Safe and deterministic — avoids overly loose fuzzy matching that introduces false positives.
 */
export function matchesBrandSearch(term: string, brand: Brand): boolean {
  const cleanTerm = term.trim();
  if (!cleanTerm) return true;

  const termLower = cleanTerm.toLowerCase();
  const brandName = brand.name ?? "";

  // 1. Direct substring match (case-insensitive)
  if (brandName.toLowerCase().includes(termLower)) {
    return true;
  }

  // 2. Normalized Arabic match
  const termNormAr = normalizeArabic(cleanTerm).toLowerCase();
  if (termNormAr && normalizeArabic(brandName).toLowerCase().includes(termNormAr)) {
    return true;
  }

  // 3. English primary name and aliases match
  const entry = BRAND_LOCALIZATION_CATALOG[brand.id];
  if (entry) {
    if (entry.primaryEnglish.toLowerCase().includes(termLower)) {
      return true;
    }
    for (const alias of entry.aliases) {
      if (alias.includes(termLower)) {
        return true;
      }
    }
  } else if (brandName) {
    // Fallback for unmapped brand by name
    const resolvedEn = getBrandEnglishName(undefined, brandName);
    if (resolvedEn && resolvedEn.toLowerCase().includes(termLower)) {
      return true;
    }
  }

  return false;
}
