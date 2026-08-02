/**
 * @file Layer 3 (part 2) — the single place that decides which provider
 * type a /register/{type} request is for. Reads the route param today;
 * this is the one function to change when the web app upgrades to
 * hostname/subdomain-based type resolution — every other call site reads
 * the type through this resolver, never the route directly.
 */

import type { ProviderType } from "@modules/providers/types";

const VALID_TYPES: readonly ProviderType[] = ["workshop", "dealer", "scrap"];

export function resolveProviderType(routeParam: string | undefined): ProviderType | null {
  if (!routeParam) return null;
  return (VALID_TYPES as readonly string[]).includes(routeParam)
    ? (routeParam as ProviderType)
    : null;
}
