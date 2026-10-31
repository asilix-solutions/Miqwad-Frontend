/**
 * @file useRoadsQueries.ts
 * @description TanStack Query hooks for InterCity Roads management and Cities lookups.
 */

import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  roadsApi,
  type RoadsQueryParams,
  type CreateRoadDto,
  type UpdateRoadDto,
  type CityDto,
  type CreateCityDto,
  type CitiesQueryParams,
} from "../api/roadsApi";

export const roadsKeys = {
  all: ["roads"] as const,
  lists: () => [...roadsKeys.all, "list"] as const,
  list: (params?: RoadsQueryParams) => [...roadsKeys.lists(), params] as const,
  available: () => [...roadsKeys.all, "available"] as const,
  details: () => [...roadsKeys.all, "detail"] as const,
  detail: (id: number) => [...roadsKeys.details(), id] as const,
  cities: () => ["cities", "reference-list"] as const,
  citiesPaginated: (params?: CitiesQueryParams) => ["cities", "paginated", params] as const,
  cityDetail: (id: number) => ["cities", "detail", id] as const,
};


export function useRoadsQuery(params?: RoadsQueryParams) {
  return useQuery({
    queryKey: roadsKeys.list(params),
    queryFn: () => roadsApi.getRoads(params),
    staleTime: 30_000,
  });
}

export function useAvailableRoadsQuery() {
  return useQuery({
    queryKey: roadsKeys.available(),
    queryFn: () => roadsApi.getAvailableRoads(),
    staleTime: 60_000,
  });
}

export function useRoadDetailQuery(id: number) {
  return useQuery({
    queryKey: roadsKeys.detail(id),
    queryFn: () => roadsApi.getRoadById(id),
    enabled: Number.isSafeInteger(id) && id > 0,
    staleTime: 30_000,
  });
}

export function useCreateRoadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRoadDto) => roadsApi.createRoad(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: roadsKeys.all });
    },
  });
}

export function useUpdateRoadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateRoadDto }) =>
      roadsApi.updateRoad(id, payload),
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: roadsKeys.all });
      void qc.invalidateQueries({ queryKey: roadsKeys.detail(variables.id) });
    },
  });
}

export function useCitiesListQuery() {
  return useQuery<CityDto[]>({
    queryKey: roadsKeys.cities(),
    queryFn: () => roadsApi.getCities({ pageSize: 100 }),
    staleTime: 5 * 60_000, // 5 minutes cache for reference cities
  });
}

export function useCitiesPaginatedQuery(params?: CitiesQueryParams) {
  return useQuery({
    queryKey: roadsKeys.citiesPaginated(params),
    queryFn: () => roadsApi.getCitiesPaginated(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

export function useCityDetailQuery(id: number | null | undefined) {
  return useQuery({
    queryKey: roadsKeys.cityDetail(id ?? 0),
    queryFn: () => roadsApi.getCityById(id!),
    enabled: typeof id === "number" && Number.isSafeInteger(id) && id > 0,
    staleTime: 60_000,
  });
}

export function useCreateCityMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCityDto) => roadsApi.createCity(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["cities"] });
      void qc.invalidateQueries({ queryKey: roadsKeys.cities() });
      void qc.invalidateQueries({ queryKey: ["admin", "cities"] });
    },
  });
}

