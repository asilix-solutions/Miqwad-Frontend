/**
 * @file serviceApi.ts
 * @description Transport layer for the Service entity (self-join tree,
 * `/api/Services` — not yet in Swagger). Mocked in-memory behind a single
 * `SERVICES_SOURCE` flag until the backend ships; flip the flag to switch
 * to the real endpoints without touching any consumer. Deliberately
 * self-contained (its own in-memory store, not the `src/shared/mocks/`
 * bridge) — see the module README/PR notes for the rationale: this entity
 * has no real controller yet, so there is nothing for the always-mock
 * prefix list in `server.ts` to shrink toward, and a self-contained mock
 * keeps the eventual deletion a one-file change.
 */
import { apiClient } from "@shared/lib/axios";
import { sleep } from "@shared/lib/utils";
import type { RawService, Service } from "@modules/services/service.types";
import type { PaginatedResponse } from "@shared/types/api";
import { adaptRawService, adaptServiceToWritePayload } from "../lib/serviceAdapter";
import type { ApiEnvelope, RawCategoriesPage as RawServicesPage } from "../lib/categoryAdapter";

/** Flip to "real" once `/api/Services` ships. Mirrors `SERVICES_SOURCE`-style flags elsewhere. */
export const SERVICES_SOURCE: "mock" | "real" = "mock";

export interface ServicesQuery {
  isActive?: boolean;
}

export interface ServiceWriteInput {
  name: string;
  parentServiceId: number | null;
}

function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success) throw new Error(envelope.message || "Request failed");
  return envelope.data;
}

// ── In-memory mock store ────────────────────────────────────────────────────

let mockSeq = 6;
const mockServices: RawService[] = [
  { id: 1, name: "صيانة عامة", parentServiceId: null, isActive: true, createdAt: "2026-01-01T00:00:00.000Z" },
  { id: 2, name: "تغيير زيت", parentServiceId: 1, isActive: true, createdAt: "2026-01-02T00:00:00.000Z" },
  { id: 3, name: "صيانة دورية", parentServiceId: 1, isActive: true, createdAt: "2026-01-02T00:00:00.000Z" },
  { id: 4, name: "كهرباء السيارات", parentServiceId: null, isActive: true, createdAt: "2026-01-03T00:00:00.000Z" },
  { id: 5, name: "فحص البطارية", parentServiceId: 4, isActive: true, createdAt: "2026-01-03T00:00:00.000Z" },
];

async function mockList(params?: ServicesQuery): Promise<PaginatedResponse<Service>> {
  await sleep(250);
  const filtered = mockServices.filter((s) =>
    params?.isActive === undefined ? true : (s.isActive ?? true) === params.isActive,
  );
  const items = filtered.map(adaptRawService);
  return { items, page: 1, pageSize: items.length, total: items.length, totalPages: 1 };
}

async function mockGet(id: number): Promise<Service> {
  await sleep(150);
  const raw = mockServices.find((s) => s.id === id);
  if (!raw) throw new Error("Service not found");
  return adaptRawService(raw);
}

async function mockCreate(input: ServiceWriteInput): Promise<Service> {
  await sleep(250);
  const raw: RawService = {
    id: mockSeq++,
    name: input.name,
    parentServiceId: input.parentServiceId,
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  mockServices.push(raw);
  return adaptRawService(raw);
}

async function mockUpdate(id: number, input: Partial<ServiceWriteInput> & { isActive?: boolean }): Promise<Service> {
  await sleep(250);
  const raw = mockServices.find((s) => s.id === id);
  if (!raw) throw new Error("Service not found");
  if (input.name !== undefined) raw.name = input.name;
  if (input.parentServiceId !== undefined) raw.parentServiceId = input.parentServiceId;
  if (input.isActive !== undefined) raw.isActive = input.isActive;
  return adaptRawService(raw);
}

async function mockRemove(id: number): Promise<void> {
  await sleep(200);
  const index = mockServices.findIndex((s) => s.id === id);
  if (index === -1) throw new Error("Service not found");
  mockServices.splice(index, 1);
}

// ── Real backend calls (inert until SERVICES_SOURCE = "real") ──────────────

async function realList(params?: ServicesQuery): Promise<PaginatedResponse<Service>> {
  const { data } = await apiClient.get<ApiEnvelope<RawServicesPage>>("/Services", {
    params: params && { IsActive: params.isActive },
  });
  const page = unwrap(data);
  return {
    items: page.items.map(adaptRawService),
    page: page.pageNumber,
    pageSize: page.pageSize,
    total: page.totalCount,
    totalPages: page.totalPages,
  };
}

async function realGet(id: number): Promise<Service> {
  const { data } = await apiClient.get<ApiEnvelope<RawService>>(`/Services/${id}`);
  return adaptRawService(unwrap(data));
}

async function realCreate(input: ServiceWriteInput): Promise<Service> {
  const { data } = await apiClient.post<ApiEnvelope<RawService>>("/Services", adaptServiceToWritePayload(input));
  return adaptRawService(unwrap(data));
}

async function realUpdate(id: number, input: Partial<ServiceWriteInput>): Promise<Service> {
  const { data } = await apiClient.put<ApiEnvelope<RawService>>(`/Services/${id}`, input);
  return adaptRawService(unwrap(data));
}

async function realRemove(id: number): Promise<void> {
  await apiClient.delete(`/Services/${id}`);
}

// ── Public API — same signatures regardless of source ───────────────────────

export const serviceApi = {
  list: (params?: ServicesQuery): Promise<PaginatedResponse<Service>> =>
    SERVICES_SOURCE === "mock" ? mockList(params) : realList(params),

  get: (id: number): Promise<Service> => (SERVICES_SOURCE === "mock" ? mockGet(id) : realGet(id)),

  create: (input: ServiceWriteInput): Promise<Service> =>
    SERVICES_SOURCE === "mock" ? mockCreate(input) : realCreate(input),

  update: (id: number, input: Partial<ServiceWriteInput>): Promise<Service> =>
    SERVICES_SOURCE === "mock" ? mockUpdate(id, input) : realUpdate(id, input),

  remove: (id: number): Promise<void> => (SERVICES_SOURCE === "mock" ? mockRemove(id) : realRemove(id)),
};
