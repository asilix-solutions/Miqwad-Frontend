/**
 * @file useCarMakes.ts
 * TanStack Query hook for the car makes reference list. Long staleTime —
 * this data is near-static and the temporary NHTSA source is slow, so we
 * avoid refetching it unnecessarily.
 */
import { useQuery } from "@tanstack/react-query";
import { carMakesApi } from "../api/carMakes.api";

export const carMakesQueryKey = ["reference", "car-makes"] as const;

export function useCarMakes() {
  return useQuery({
    queryKey: carMakesQueryKey,
    queryFn: () => carMakesApi.list(),
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 2,
    retry: 1,
  });
}
