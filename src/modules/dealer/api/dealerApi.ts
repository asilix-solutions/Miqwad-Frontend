/**
 * Dealer API client
 *
 * Products no longer live here — a dealer "product" is a thin wrapper
 * around the admin service catalog (`/api/provider-services`), see
 * `providerServicesApi.ts`. This client keeps orders/shipments/dues, which
 * still go through the `/dealer/*` mock bridge.
 */
import { apiClient } from "@shared/lib/axios";
import type { PaginatedResponse } from "@shared/types/api";
import type { Order, OrderStatus, Shipment, ShipmentStatus, DealerDues } from "../types";

export const dealerApi = {
  getOrders: async (params?: Record<string, any>): Promise<PaginatedResponse<Order>> => {
    const { data } = await apiClient.get<PaginatedResponse<Order>>("/dealer/orders", { params });
    return data;
  },
  getOrder: async (id: string): Promise<Order> => {
    const { data } = await apiClient.get<Order>(`/dealer/orders/${id}`);
    return data;
  },
  updateOrderStatus: async (id: string, status: OrderStatus): Promise<Order> => {
    const { data } = await apiClient.patch<Order>(`/dealer/orders/${id}/status`, { status });
    return data;
  },
  shipOrder: async (
    id: string,
    payload: { carrier?: string; trackingNumber?: string },
  ): Promise<Order> => {
    const { data } = await apiClient.post<Order>(`/dealer/orders/${id}/ship`, payload);
    return data;
  },
  cancelOrder: async (id: string, reason?: string): Promise<Order> => {
    const { data } = await apiClient.post<Order>(
      `/dealer/orders/${id}/cancel`,
      reason !== undefined ? { reason } : {},
    );
    return data;
  },
  getShipments: async (params?: Record<string, any>): Promise<PaginatedResponse<Shipment>> => {
    const { data } = await apiClient.get<PaginatedResponse<Shipment>>("/dealer/shipments", { params });
    return data;
  },
  updateShipmentStatus: async (id: string, status: ShipmentStatus): Promise<Shipment> => {
    const { data } = await apiClient.patch<Shipment>(`/dealer/shipments/${id}/status`, { status });
    return data;
  },
  getDues: async (): Promise<DealerDues> => {
    const { data } = await apiClient.get<DealerDues>("/dealer/dues");
    return data;
  },
};
