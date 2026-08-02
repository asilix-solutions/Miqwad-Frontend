/**
 * @file roleRegistry.ts
 * @description Single source of truth for the backend's numeric role enum
 * (Admin=1, Dealer=2, WorkshopOwner=3, SalvageSpecialist=4, TowTruckDriver=5,
 * Customer=6). Adding a future provider subtype is a one-line change here —
 * no component may compare a raw role number directly; everything resolves
 * through the helpers below. Kept separate from `auth.adapter.ts`'s own
 * validated login role map (different concern: that one drives session/RBAC,
 * this one drives the admin Users list/detail display).
 */

import type { TFunction } from "i18next";

export type RoleGroup = "client" | "provider" | "driver" | "admin";

export interface RoleConfig {
  key: string;
  labelI18nKey: string;
  group: RoleGroup;
}

export const ROLE_REGISTRY: Record<number, RoleConfig> = {
  1: { key: "admin", labelI18nKey: "superAdmin.users.roles.admin", group: "admin" },
  2: { key: "dealer", labelI18nKey: "superAdmin.users.roles.dealer", group: "provider" },
  3: { key: "workshop", labelI18nKey: "superAdmin.users.roles.workshop", group: "provider" },
  4: { key: "salvage", labelI18nKey: "superAdmin.users.roles.salvage", group: "provider" },
  5: { key: "driver", labelI18nKey: "superAdmin.users.roles.driver", group: "driver" },
  6: { key: "customer", labelI18nKey: "superAdmin.users.roles.customer", group: "client" },
};

/**
 * Per-role tabs for the Users screen (excludes "admin"). The live backend's
 * `FilterBy=roleId&FilterValue=<n>` only accepts a single value, so tabs are
 * one roleId each rather than grouped (provider group = dealer+workshop+
 * salvage) — each tab filters cleanly server-side with correct pagination.
 */
export const ROLE_TABS: ReadonlyArray<{ roleId: number; labelI18nKey: string }> = Object.entries(ROLE_REGISTRY)
  .filter(([, config]) => config.group !== "admin")
  .map(([roleId, config]) => ({ roleId: Number(roleId), labelI18nKey: config.labelI18nKey }));

export function roleConfig(role?: number): RoleConfig | undefined {
  return role !== undefined ? ROLE_REGISTRY[role] : undefined;
}

export function roleGroup(role?: number): RoleGroup | undefined {
  return roleConfig(role)?.group;
}

export function roleLabel(role: number | undefined, t: TFunction): string {
  const config = roleConfig(role);
  return config ? t(config.labelI18nKey) : "—";
}

export function isAdminRole(role?: number): boolean {
  return roleGroup(role) === "admin";
}
