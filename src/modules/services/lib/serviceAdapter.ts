/**
 * @file serviceAdapter.ts
 * @description Single translation boundary for the Service entity
 * (self-join tree via `parentServiceId`). When `/api/Services` goes live,
 * only `serviceApi`'s `SERVICES_SOURCE` flag flips; these adapter shapes —
 * and every consumer built on top of the internal `Service` type — stay
 * unchanged. Mirrors the `categoryAdapter.ts` pattern from PR #25.
 */
import type { RawService, Service } from "@modules/services/service.types";

/**
 * Adapts one raw backend service into the internal `Service` shape.
 * Never throws — falls back to neutral defaults so a malformed item can't
 * crash a tree render.
 */
export function adaptRawService(raw: RawService): Service {
  return {
    id: raw.id,
    name: raw.name ?? "",
    parentServiceId: raw.parentServiceId ?? null,
    isActive: raw.isActive ?? true,
    createdAt: raw.createdAt,
  };
}

/** Builds the create/update request body — the write shape the real backend will accept. */
export function adaptServiceToWritePayload(input: {
  name: string;
  parentServiceId: number | null;
}): { name: string; parentServiceId: number | null } {
  return { name: input.name, parentServiceId: input.parentServiceId };
}

/**
 * Assembles a flat Service list into a self-join tree via `parentServiceId`.
 * Same shape/logic as `categoryTree.ts`'s `getCategoryTree`, operating on
 * `parentServiceId` instead of `parentId`, with no provider-type scoping
 * (the Service entity carries none) and no explicit sort field (falls back
 * to stable insertion order).
 */
export function buildServiceTree(flat: Service[]): Service[] {
  const nodeMap = new Map<number, Service>();
  for (const service of flat) {
    nodeMap.set(service.id, { ...service, children: [] });
  }

  const roots: Service[] = [];
  for (const node of nodeMap.values()) {
    if (node.parentServiceId === null) {
      roots.push(node);
    } else {
      const parent = nodeMap.get(node.parentServiceId);
      if (parent) {
        parent.children!.push(node);
      } else {
        roots.push(node);
      }
    }
  }

  return roots;
}
