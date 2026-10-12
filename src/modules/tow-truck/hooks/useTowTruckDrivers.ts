import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@modules/admin/api/adminApi";
import { adminKeys } from "@modules/admin/hooks/useAdminQueries";
import { validateDriverPage } from "../lib/dispatchModel";

export function useTowTruckDrivers(page: number, enabled: boolean) {
  // Reuse Users transport and cache; role is the sole server filter. Do not
  // combine active/search filters: the backend only honors one FilterBy.
  const params = { page, pageSize: 10, roleId: 5, includeAdmins: true };
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => adminApi.getUsers(params),
    enabled,
    staleTime: 0,
    select: (data) => validateDriverPage(data, page),
  });
}
