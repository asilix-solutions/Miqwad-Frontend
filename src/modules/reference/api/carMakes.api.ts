/**
 * @file carMakes.api.ts
 * Source-agnostic entry point for reference car-makes/models data. This is
 * the single swap point for moving off the temporary NHTSA source.
 *
 * TODO: wire to backend — replace the function bodies with
 * apiClient.get("/reference/car-makes") when .NET is ready. Nothing above
 * this file (hooks, schema, pages) changes.
 */
import { fetchMakesFromNhtsa, fetchModelsFromNhtsa } from "./nhtsa.adapter";

export const carMakesApi = {
  list: () => fetchMakesFromNhtsa(),
  modelsForMake: (makeId: string) => fetchModelsFromNhtsa(makeId),
};
