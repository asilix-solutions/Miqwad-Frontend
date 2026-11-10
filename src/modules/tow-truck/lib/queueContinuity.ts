import type { MouseEvent } from "react";
import type { NavigateFunction } from "react-router-dom";

export interface QueueReturnContext {
  url: string;
  orderId: string;
  control: "preview" | "details";
  scrollY: number;
}
export const validOrderId = (id: string): boolean =>
  /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id));

/** Allow only the three real queue routes and supported query context. Never return to a preview. */
export function safeQueueUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const candidate = value.startsWith("?") ? `/admin/tow-truck${value}` : value;
  const match = /^(\/admin\/tow-truck(?:\/(?:intracity|intercity))?)\/?(?:\?([^#]*))?$/.exec(
    candidate,
  );
  if (!match) return null;
  let pathname = match[1];
  const params = new URLSearchParams(match[2]);
  const legacy = params.get("serviceType");
  if (pathname === "/admin/tow-truck" && (legacy === "intracity" || legacy === "intercity"))
    pathname += `/${legacy}`;
  const clean = new URLSearchParams();
  const page = Number(params.get("page"));
  if (Number.isSafeInteger(page) && page > 1) clean.set("page", String(page));
  const track = params.get("trackNumber")?.trim();
  if (track) clean.set("trackNumber", track);
  return `${pathname}${clean.size ? `?${clean}` : ""}`;
}

export function readQueueReturn(state: unknown): QueueReturnContext | null {
  if (!state || typeof state !== "object" || !("towQueueReturn" in state)) return null;
  const value = state.towQueueReturn;
  if (!value || typeof value !== "object") return null;
  if (!("url" in value) || !("orderId" in value) || !("control" in value) || !("scrollY" in value))
    return null;
  const url = safeQueueUrl(value.url);
  if (
    !url ||
    typeof value.orderId !== "string" ||
    !validOrderId(value.orderId) ||
    (value.control !== "preview" && value.control !== "details") ||
    typeof value.scrollY !== "number" ||
    !Number.isFinite(value.scrollY) ||
    value.scrollY < 0
  )
    return null;
  return { url, orderId: value.orderId, control: value.control, scrollY: value.scrollY };
}

export function queueReturnDestination(state: unknown): string {
  const context = readQueueReturn(state);
  if (context) return context.url;
  const fromQueue =
    state && typeof state === "object" && "fromQueue" in state ? state.fromQueue : null;
  return safeQueueUrl(fromQueue) ?? "/admin/tow-truck";
}

/** Save UI-only context in this history entry before leaving; no persistent storage or reads. */
export function openOrderFromQueue(navigate: NavigateFunction, context: QueueReturnContext): void {
  const state = { fromQueue: context.url, towQueueReturn: context };
  void navigate(context.url, { replace: true, state });
  void navigate(`/admin/tow-truck/${context.orderId}`, { state });
}

/** A breakpoint may replace the original element. Find only a visible control for that request. */
export function restoreQueuePosition(
  container: HTMLElement | null,
  fallback: HTMLElement | null,
  context: QueueReturnContext | null,
): boolean {
  if (!container?.isConnected || !fallback?.isConnected) return false;
  const visible = (element: HTMLElement) =>
    element.isConnected &&
    element.getClientRects().length > 0 &&
    !element.closest('[inert], [aria-hidden="true"]') &&
    !element.hasAttribute("disabled");
  const target = context
    ? Array.from(container.querySelectorAll<HTMLElement>("[data-queue-control]")).find(
        (element) =>
          element.dataset.orderId === context.orderId &&
          element.dataset.queueControl === context.control &&
          visible(element),
      )
    : undefined;
  (target ?? fallback).focus({ preventScroll: true });
  if (context) window.scrollTo({ top: context.scrollY, behavior: "instant" });
  return true;
}

/** Keep modified/new-tab clicks native; intercept only ordinary in-app request navigation. */
export function handleOrderLinkClick(
  event: MouseEvent<HTMLAnchorElement>,
  navigate: NavigateFunction,
  url: string,
  orderId: string,
  control: QueueReturnContext["control"],
  scrollY?: number,
): void {
  if (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    (event.currentTarget.target && event.currentTarget.target !== "_self")
  )
    return;
  event.preventDefault();
  openOrderFromQueue(navigate, {
    url: safeQueueUrl(url) ?? "/admin/tow-truck",
    orderId,
    control,
    scrollY: scrollY ?? window.scrollY,
  });
}
