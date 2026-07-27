/**
 * @file useCarModels.ts
 * TanStack Query hook for models of a given car make. Disabled until a make
 * is selected. Long staleTime — this data is near-static and the temporary
 * NHTSA source is slow, so we avoid refetching it unnecessarily.
 */
import { useQuery } from "@tanstack/react-query";
import { carMakesApi } from "../api/carMakes.api";

export const carModelsQueryKey = (makeId: string) => ["reference", "car-models", makeId] as const;

export function useCarModels(makeId: string | null) {
  return useQuery({
    queryKey: carModelsQueryKey(makeId ?? ""),
    queryFn: () => carMakesApi.modelsForMake(makeId as string),
    enabled: Boolean(makeId),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
    retry: 1,
  });
}
