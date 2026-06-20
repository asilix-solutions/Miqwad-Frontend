/**
 * Dealer API client
 */
import { apiClient } from "@shared/lib/axios";
import type { PaginatedResponse } from "@shared/types/api";
import type { Product, Order, Shipment, DealerDues } from "../types";

export const dealerApi = {
  getProducts: async (params?: Record<string, any>): Promise<PaginatedResponse<Product>> => {
    const { data } = await apiClient.get<PaginatedResponse<Product>>("/dealer/products", { params });
    return data;
  },
  getProduct: async (id: string): Promise<Product> => {
    const { data } = await apiClient.get<Product>(`/dealer/products/${id}`);
    return data;
  },
  getOrders: async (params?: Record<string, any>): Promise<PaginatedResponse<Order>> => {
    const { data } = await apiClient.get<PaginatedResponse<Order>>("/dealer/orders", { params });
    return data;
  },
  getOrder: async (id: string): Promise<Order> => {
    const { data } = await apiClient.get<Order>(`/dealer/orders/${id}`);
    return data;
  },
  getShipments: async (params?: Record<string, any>): Promise<PaginatedResponse<Shipment>> => {
    const { data } = await apiClient.get<PaginatedResponse<Shipment>>("/dealer/shipments", { params });
    return data;
  },
  getDues: async (): Promise<DealerDues> => {
    const { data } = await apiClient.get<DealerDues>("/dealer/dues");
    return data;
  },
};
