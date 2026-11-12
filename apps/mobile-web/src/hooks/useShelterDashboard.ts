import { useQuery } from '@tanstack/react-query';
import type { ApiResponse, ShelterDashboardSummary } from '@kapa/shared';
import { kapaService } from '@/services/kapaService';

export const SHELTER_DASHBOARD_QUERY_KEY = ['dashboard', 'shelter-summary'] as const;

export function useShelterDashboard(enabled = true) {
  return useQuery({
    queryKey: SHELTER_DASHBOARD_QUERY_KEY,
    enabled,
    queryFn: async () => {
      const response = await kapaService.get<
        ApiResponse<ShelterDashboardSummary>
      >('/dashboard/summary');
      return response.data.data;
    },
  });
}
