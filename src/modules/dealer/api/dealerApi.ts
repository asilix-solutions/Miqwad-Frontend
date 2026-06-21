/**
 * Dealer API client
 */
import { apiClient } from "@shared/lib/axios";
import type { PaginatedResponse } from "@shared/types/api";
import type { Product, ProductStatus, Order, OrderStatus, Shipment, ShipmentStatus, DealerDues } from "../types";

export const dealerApi = {
  getProducts: async (params?: Record<string, any>): Promise<PaginatedResponse<Product>> => {
    const { data } = await apiClient.get<PaginatedResponse<Product>>("/dealer/products", { params });
    return data;
  },
  getProduct: async (id: string): Promise<Product> => {
    const { data } = await apiClient.get<Product>(`/dealer/products/${id}`);
    return data;
  },
  createProduct: async (payload: Partial<Product>): Promise<Product> => {
    const { data } = await apiClient.post<Product>("/dealer/products", payload);
    return data;
  },
  updateProduct: async (id: string, payload: Partial<Product>): Promise<Product> => {
    const { data } = await apiClient.patch<Product>(`/dealer/products/${id}`, payload);
    return data;
  },
  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/dealer/products/${id}`);
  },
  updateProductStatus: async (id: string, status: ProductStatus): Promise<Product> => {
    const { data } = await apiClient.patch<Product>(`/dealer/products/${id}/status`, { status });
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
