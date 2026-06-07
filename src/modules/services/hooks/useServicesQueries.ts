import { useQuery } from "@tanstack/react-query";
import { servicesApi } from "../api/servicesApi";

/**
 * Read-side queries for the Services catalog.
 *
 * Categories are stable; we cache them aggressively to keep the
 * provider register stepper and the customer browse page snappy.
 */
export const servicesKeys = {
  all: ["services"] as const,
  categories: () => [...servicesKeys.all, "categories"] as const,
  subcategories: (categoryId: number) =>
    [...servicesKeys.all, "subcategories", categoryId] as const,
};

const STABLE = 30 * 60 * 1000;

export function useServiceCategoriesQuery() {
  return useQuery({
    queryKey: servicesKeys.categories(),
    queryFn: () => servicesApi.categories(),
    staleTime: STABLE,
  });
}

export function useServiceSubcategoriesQuery(categoryId: number | null) {
  return useQuery({
    queryKey: categoryId
      ? servicesKeys.subcategories(categoryId)
      : ["services", "subcategories", "noop"],
    queryFn: () => servicesApi.subcategories(categoryId!),
    enabled: categoryId != null && categoryId > 0,
    staleTime: STABLE,
  });
}
