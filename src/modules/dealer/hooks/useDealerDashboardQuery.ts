import { useQuery } from "@tanstack/react-query";
import { useAppSelector } from "@app/store";
import { providerServicesApi } from "@shared/provider-services";
import { dealerApi } from "../api/dealerApi";
import { getDealerDashboardSummary } from "../api/dealerDashboardApi";

export function useDealerDashboardQuery() {
  const user = useAppSelector((state) => state.auth.user);
  return useQuery({
    queryKey: ["dealer", "dashboard", user?.id],
    queryFn: ({ signal }) => {
      if (!user) throw new Error("Missing authenticated user");
      return getDealerDashboardSummary(user.id, signal);
    },
    enabled: user?.role === "provider",
    retry: false,
  });
}

export function useDealerDashboardData() {
  const user = useAppSelector((state) => state.auth.user);
  const summary = useDealerDashboardQuery();
  const serviceCount =
    summary.data?.user.roleId === 2 ? summary.data.providerMetrics?.totalServices : undefined;
  // Reuse the live catalog only when the summary cannot provide this metric.
  const products = useQuery({
    queryKey: ["dealer", "dashboard", "products", user?.id],
    queryFn: async () => (await providerServicesApi.list()).total,
    enabled: !!user && serviceCount == null && (summary.isError || summary.isSuccess),
    retry: false,
  });
  // /dealer/dues is an existing DEV mock bridge, not a production ledger.
  const dues = useQuery({
    queryKey: ["dealer", "dashboard", "demoDues", user?.id],
    queryFn: () => dealerApi.getDues(),
    enabled: import.meta.env.DEV && !!user,
    retry: false,
  });
  return { summary, products, dues, serviceCount };
}
