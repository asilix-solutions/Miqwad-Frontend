/**
 * @file towTruckWorkspace.ts
 * @description Operational workspace utilities for Tow Truck Center (Phase 2A).
 * Resolves active operational workspace from route pathname and maps to server serviceType.
 */

export type TowTruckWorkspace = "all" | "intracity" | "intercity";

/**
 * Resolves the operational workspace from the given route pathname.
 * Handles trailing slashes, full paths, and nested segments.
 */
export function resolveTowTruckWorkspace(pathname: string): TowTruckWorkspace {
  const clean = pathname.toLowerCase().replace(/\/+$/, "");
  if (clean === "/admin/tow-truck/intracity" || clean.endsWith("/tow-truck/intracity")) {
    return "intracity";
  }
  if (clean === "/admin/tow-truck/intercity" || clean.endsWith("/tow-truck/intercity")) {
    return "intercity";
  }
  return "all";
}

/**
 * Maps the operational workspace to backend ServiceType query parameter.
 * - All: undefined (omitted from GET /api/Orders)
 * - IntraCity: 1
 * - InterCity: 2
 */
export function workspaceToServiceType(workspace: TowTruckWorkspace): number | undefined {
  if (workspace === "intracity") return 1;
  if (workspace === "intercity") return 2;
  return undefined;
}

/**
 * Returns the canonical route path for a given workspace.
 */
export function workspaceToRoute(workspace: TowTruckWorkspace): string {
  if (workspace === "intracity") return "/admin/tow-truck/intracity";
  if (workspace === "intercity") return "/admin/tow-truck/intercity";
  return "/admin/tow-truck";
}

/**
 * Builds the destination URL for workspace navigation, preserving search filter (trackNumber)
 * while intentionally discarding pagination (page) so switching workspaces resets to page 1.
 */
export function buildWorkspaceNavigationUrl(
  targetWorkspace: TowTruckWorkspace,
  currentSearchParams?: URLSearchParams | string,
): string {
  const base = workspaceToRoute(targetWorkspace);
  const params = new URLSearchParams(currentSearchParams);

  const trackNumber = params.get("trackNumber")?.trim();
  const nextParams = new URLSearchParams();
  if (trackNumber) {
    nextParams.set("trackNumber", trackNumber);
  }

  const qs = nextParams.toString();
  return qs ? `${base}?${qs}` : base;
}
