import { apiClient } from "@shared/lib/axios";
import type { ServiceCategory, ServiceSubcategory } from "../types";

/**
 * Transport layer for the Services catalog endpoints.
 * Backed by the .NET Swagger contract — the in-process mock
 * intercepts these calls until the backend is live.
 */
export const servicesApi = {
  categories: async (): Promise<ServiceCategory[]> => {
    const { data } = await apiClient.get<ServiceCategory[]>("/Services/categories");
    return data;
  },

  subcategories: async (categoryId: number): Promise<ServiceSubcategory[]> => {
    const { data } = await apiClient.get<ServiceSubcategory[]>(
      `/Services/categories/${categoryId}/subcategories`,
    );
    return data;
  },
};
