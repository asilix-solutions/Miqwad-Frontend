/** Route-derived shell context; never stores order state or authorizes navigation. */
export function isTowTruckPath(pathname: string): boolean {
  return /^\/admin\/tow-truck(?:\/|$)/i.test(pathname);
}

export function isTowTruckQueuePath(pathname: string): boolean {
  return /^\/admin\/tow-truck(?:\/(?:intracity|intercity))?\/?$/i.test(pathname);
}

/** Reuse only the supported queue search from the current route or detail return state. */
export function queueNavigationSearch(pathname: string, search: string, state: unknown): string {
  if (isTowTruckQueuePath(pathname)) return search;
  if (!isTowTruckPath(pathname) || !state || typeof state !== "object" || !("fromQueue" in state))
    return "";
  const fromQueue = state.fromQueue;
  if (typeof fromQueue !== "string") return "";
  if (fromQueue.startsWith("?")) return fromQueue;
  const [path, query = ""] = fromQueue.split("?");
  return isTowTruckQueuePath(path) ? query : "";
}
