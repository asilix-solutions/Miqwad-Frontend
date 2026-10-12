import { useQuery } from "@tanstack/react-query";
import { orderListOptions, orderDetailOptions } from "@modules/orders/hooks/useOrdersQueries";
import { adaptTowTruck, adaptTowTruckPage } from "../lib/towTruckModel";

export const TOW_PAGE_SIZE = 20;
export function useTowTruckQueue(page: number) {
  return useQuery({
    ...orderListOptions({
      orderType: 3,
      pageNumber: page,
      pageSize: TOW_PAGE_SIZE,
      sortBy: "createdAt",
      sortDescending: true,
    }),
    select: (data) => {
      const result = adaptTowTruckPage(data);
      if (result.page !== page) throw new Error("Mismatched page response");
      return result;
    },
    staleTime: 0,
  });
}
export function useTowTruckDetail(id: string | undefined) {
  return useQuery({
    ...orderDetailOptions(id ?? ""),
    enabled: !!id && /^[1-9]\d*$/.test(id) && Number.isSafeInteger(Number(id)),
    select: (raw) => {
      const order = adaptTowTruck(raw);
      if (order.id !== id) throw new Error("Mismatched order identity");
      return order;
    },
    staleTime: 0,
    // No list-derived detail placeholder: only a response for this ID is shown.
  });
}
