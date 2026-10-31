/**
 * @file roadsApi.ts
 * @description API client for InterCity Roads & Cities endpoints based on verified Swagger v1 contract.
 * Endpoints:
 * - GET /api/Roads (paginated routes)
 * - GET /api/Roads/available (active available routes)
 * - GET /api/Roads/{id} (single route)
 * - POST /api/Roads (create route)
 * - PUT /api/Roads/{id} (update route price and status)
 * - GET /api/Cities (cities list)
 * - GET /api/Cities/{id} (single city)
 */

import { apiClient } from "@shared/lib/axios";
import type { PaginatedResponse } from "@shared/types/api";

export interface RoadResponseDto {
  id: number;
  originCityId: number;
  originCityName: string | null;
  destinationCityId: number;
  destinationCityName: string | null;
  cost: number;
  isActive: boolean;
  createdAt: string;
}

export interface CreateRoadDto {
  originCityId: number;
  destinationCityId: number;
  cost: number;
}

export interface UpdateRoadDto {
  cost: number;
  isActive?: boolean;
}

export interface RoadsQueryParams {
  pageNumber?: number;
  pageSize?: number;
  originCityId?: number;
  destinationCityId?: number;
  isActive?: boolean;
  sortBy?: string;
  sortDescending?: boolean;
  filterBy?: string;
  filterValue?: string;
}

export interface CityDto {
  id: number;
  name: string | null;
  countryCode: string | null;
  googlePlaceId: string | null;
  latitude: number | null;
  longitude: number | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateCityDto {
  name: string;
  countryCode: string;
  googlePlaceId: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface CreateCityResult {
  city: CityDto;
  isExisting: boolean;
  message?: string | null;
}

export interface CitiesQueryParams {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDescending?: boolean;
  filterBy?: string;
  filterValue?: string;
}


interface ApiResponseEnvelope<T> {
  success: boolean;
  message: string | null;
  data: T;
  errors: string[] | null;
}

function unwrapPayload<T>(rawData: unknown): T {
  if (rawData && typeof rawData === "object") {
    // 1. Documented standard API envelope: { success: boolean, message?: string | null, data?: T, errors?: string[] | null }
    if ("success" in rawData) {
      const envelope = rawData as ApiResponseEnvelope<T>;
      if (!envelope.success) {
        const errorMsg =
          envelope.message ||
          (Array.isArray(envelope.errors) && envelope.errors.length > 0 ? envelope.errors.join(", ") : null) ||
          "API request failed";
        throw new Error(errorMsg);
      }
      return envelope.data;
    }

    // 2. Direct data envelope: { data: T }
    if ("data" in rawData) {
      return (rawData as { data: T }).data;
    }
  }

  // 3. Direct payload, empty 204 string/null, or already unwrapped entity
  return rawData as T;
}

export const roadsApi = {
  /**
   * Fetch paginated roads list with optional filters.
   * Endpoint: GET /Roads (resolves to /api/Roads via apiClient baseURL)
   */
  getRoads: async (params?: RoadsQueryParams): Promise<PaginatedResponse<RoadResponseDto>> => {
    const queryParams: Record<string, unknown> = {};
    if (params?.pageNumber) queryParams.PageNumber = params.pageNumber;
    if (params?.pageSize) queryParams.PageSize = params.pageSize;
    if (params?.originCityId) queryParams.originCityId = params.originCityId;
    if (params?.destinationCityId) queryParams.destinationCityId = params.destinationCityId;
    if (typeof params?.isActive === "boolean") queryParams.isActive = params.isActive;
    if (params?.sortBy) queryParams.SortBy = params.sortBy;
    if (typeof params?.sortDescending === "boolean") queryParams.SortDescending = params.sortDescending;
    if (params?.filterBy) queryParams.FilterBy = params.filterBy;
    if (params?.filterValue) queryParams.FilterValue = params.filterValue;

    interface RoadsPaginatedPayload {
      items: RoadResponseDto[];
      totalCount?: number;
      pageNumber?: number;
      pageSize?: number;
      totalPages?: number;
    }

    const { data } = await apiClient.get<ApiResponseEnvelope<RoadsPaginatedPayload> | RoadsPaginatedPayload | RoadResponseDto[]>("/Roads", {
      params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
    });

    const payload = unwrapPayload<RoadsPaginatedPayload | RoadResponseDto[]>(data);
    if (payload && typeof payload === "object" && "items" in payload && Array.isArray(payload.items)) {
      const total = payload.totalCount ?? payload.items.length;
      const pageSize = payload.pageSize ?? params?.pageSize ?? 20;
      return {
        items: payload.items,
        total,
        page: payload.pageNumber ?? params?.pageNumber ?? 1,
        pageSize,
        totalPages: payload.totalPages ?? Math.max(1, Math.ceil(total / pageSize)),
      };
    }

    if (Array.isArray(payload)) {
      return {
        items: payload,
        total: payload.length,
        page: 1,
        pageSize: Math.max(1, payload.length),
        totalPages: 1,
      };
    }

    if (payload === null || payload === undefined) {
      return {
        items: [],
        total: 0,
        page: params?.pageNumber ?? 1,
        pageSize: params?.pageSize ?? 20,
        totalPages: 0,
      };
    }

    throw new Error("Malformed roads response: expected paginated items or array");
  },

  /**
   * Fetch all active available roads (unpaginated).
   * Endpoint: GET /Roads/available
   */
  getAvailableRoads: async (): Promise<RoadResponseDto[]> => {
    const { data } = await apiClient.get<ApiResponseEnvelope<RoadResponseDto[]> | RoadResponseDto[]>("/Roads/available");
    const payload = unwrapPayload<RoadResponseDto[]>(data);
    if (Array.isArray(payload)) {
      return payload;
    }
    if (payload === null || payload === undefined) {
      return [];
    }
    throw new Error("Malformed available roads response: expected an array");
  },

  /**
   * Get single road by ID.
   * Endpoint: GET /Roads/{id}
   */
  getRoadById: async (id: number): Promise<RoadResponseDto> => {
    const { data } = await apiClient.get<ApiResponseEnvelope<RoadResponseDto> | RoadResponseDto>(`/Roads/${id}`);
    const payload = unwrapPayload<RoadResponseDto>(data);
    if (!payload || typeof payload !== "object" || !("id" in payload)) {
      const msg = (data as ApiResponseEnvelope<unknown>)?.message;
      throw new Error(msg || `Failed to fetch road #${id}`);
    }
    return payload;
  },

  /**
   * Create a new directional route between origin and destination cities.
   * Endpoint: POST /Roads
   */
  createRoad: async (payload: CreateRoadDto): Promise<RoadResponseDto> => {
    const { data } = await apiClient.post<ApiResponseEnvelope<RoadResponseDto> | RoadResponseDto>("/Roads", payload);
    const unwrapped = unwrapPayload<RoadResponseDto>(data);
    if (!unwrapped || typeof unwrapped !== "object" || !("id" in unwrapped)) {
      const msg = (data as ApiResponseEnvelope<unknown>)?.message;
      throw new Error(msg || "Failed to create road");
    }
    return unwrapped;
  },

  /**
   * Update road price and/or active status.
   * Endpoint: PUT /Roads/{id}
   */
  updateRoad: async (id: number, payload: UpdateRoadDto): Promise<RoadResponseDto> => {
    const response = await apiClient.put<ApiResponseEnvelope<RoadResponseDto> | RoadResponseDto | "" | null>(`/Roads/${id}`, payload);
    const unwrapped = unwrapPayload<RoadResponseDto | "" | null>(response.data);
    if (unwrapped && typeof unwrapped === "object" && "id" in unwrapped) {
      return unwrapped;
    }
    // Return reconstructed representation only for documented 204 No Content / empty response
    if (response.status === 204 || unwrapped === "" || unwrapped === null || unwrapped === undefined) {
      return {
        id,
        originCityId: 0,
        originCityName: null,
        destinationCityId: 0,
        destinationCityName: null,
        cost: payload.cost,
        isActive: payload.isActive ?? true,
        createdAt: new Date().toISOString(),
      };
    }
    throw new Error(`Malformed update road response for route #${id}`);
  },

  /**
   * Fetch cities list from /Cities.
   * Endpoint: GET /Cities
   */
  getCities: async (params?: { pageNumber?: number; pageSize?: number }): Promise<CityDto[]> => {
    const queryParams: Record<string, unknown> = {
      PageNumber: params?.pageNumber ?? 1,
      PageSize: params?.pageSize ?? 100,
    };
    interface CitiesPaginatedPayload {
      items?: CityDto[];
    }
    const { data } = await apiClient.get<ApiResponseEnvelope<CitiesPaginatedPayload | CityDto[]> | CitiesPaginatedPayload | CityDto[]>("/Cities", {
      params: queryParams,
    });

    const payload = unwrapPayload<CitiesPaginatedPayload | CityDto[]>(data);
    if (Array.isArray(payload)) {
      return payload;
    }
    if (payload && typeof payload === "object" && "items" in payload && Array.isArray(payload.items)) {
      return payload.items;
    }
    if (payload === null || payload === undefined) {
      return [];
    }
    throw new Error("Malformed cities response: expected array or items collection");
  },

  /**
   * Fetch single city by ID.
   * Endpoint: GET /Cities/{id}
   */
  getCityById: async (id: number): Promise<CityDto> => {
    const { data } = await apiClient.get<ApiResponseEnvelope<CityDto> | CityDto>(`/Cities/${id}`);
    const payload = unwrapPayload<CityDto>(data);
    if (!payload || typeof payload !== "object" || !("id" in payload)) {
      const msg = (data as ApiResponseEnvelope<unknown>)?.message;
      throw new Error(msg || `Failed to fetch city #${id}`);
    }
    return payload;
  },

  /**
   * Create a new city or retrieve existing if googlePlaceId already registered.
   * Endpoint: POST /Cities (resolves to /api/Cities via apiClient baseURL)
   */
  createCity: async (payload: CreateCityDto): Promise<CreateCityResult> => {
    const response = await apiClient.post<ApiResponseEnvelope<CityDto> | CityDto>("/Cities", payload);
    const unwrapped = unwrapPayload<CityDto>(response.data);
    if (!unwrapped || typeof unwrapped !== "object" || !("id" in unwrapped)) {
      const msg = (response.data as ApiResponseEnvelope<unknown>)?.message;
      throw new Error(msg || "Failed to create city");
    }
    const message = (response.data as ApiResponseEnvelope<unknown>)?.message ?? null;
    const isExisting =
      response.status === 200 || (typeof message === "string" && /exist|موجود/i.test(message));
    return {
      city: unwrapped,
      isExisting,
      message,
    };
  },

  /**
   * Fetch paginated cities list with total count for admin cities table.
   * Endpoint: GET /Cities
   */
  getCitiesPaginated: async (params?: CitiesQueryParams): Promise<PaginatedResponse<CityDto>> => {
    const queryParams: Record<string, unknown> = {};
    if (params?.pageNumber) queryParams.PageNumber = params.pageNumber;
    if (params?.pageSize) queryParams.PageSize = params.pageSize;
    if (params?.sortBy) queryParams.SortBy = params.sortBy;
    if (typeof params?.sortDescending === "boolean") queryParams.SortDescending = params.sortDescending;
    if (params?.filterBy) queryParams.FilterBy = params.filterBy;
    if (params?.filterValue) queryParams.FilterValue = params.filterValue;

    interface CitiesPaginatedPayload {
      items?: CityDto[];
      totalCount?: number;
      pageNumber?: number;
      pageSize?: number;
      totalPages?: number;
    }

    const { data } = await apiClient.get<ApiResponseEnvelope<CitiesPaginatedPayload | CityDto[]> | CitiesPaginatedPayload | CityDto[]>("/Cities", {
      params: Object.keys(queryParams).length > 0 ? queryParams : undefined,
    });

    const payload = unwrapPayload<CitiesPaginatedPayload | CityDto[]>(data);
    if (payload && typeof payload === "object" && "items" in payload && Array.isArray(payload.items)) {
      const total = payload.totalCount ?? payload.items.length;
      const pageSize = payload.pageSize ?? params?.pageSize ?? 20;
      return {
        items: payload.items,
        total,
        page: payload.pageNumber ?? params?.pageNumber ?? 1,
        pageSize,
        totalPages: payload.totalPages ?? Math.max(1, Math.ceil(total / pageSize)),
      };
    }

    if (Array.isArray(payload)) {
      return {
        items: payload,
        total: payload.length,
        page: 1,
        pageSize: Math.max(1, payload.length),
        totalPages: 1,
      };
    }

    if (payload === null || payload === undefined) {
      return {
        items: [],
        total: 0,
        page: params?.pageNumber ?? 1,
        pageSize: params?.pageSize ?? 20,
        totalPages: 0,
      };
    }

    throw new Error("Malformed cities response: expected array or items collection");
  },
};

