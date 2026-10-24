import { isAxiosError } from 'axios';
import { useQuery } from '@tanstack/react-query';
import type {
  ApiResponse,
  PaginatedSystemEvents,
  SystemEventTypes,
} from '@kapa/shared';
import { kapaService } from '@/services/kapaService';
import { useAuth } from '@/hooks/useAuth';

export interface UseUserEventsParams {
  page?: number;
  limit?: number;
  type?: SystemEventTypes;
}

async function fetchUserEvents({
  page = 1,
  limit = 10,
  type,
}: UseUserEventsParams): Promise<PaginatedSystemEvents> {
  const response = await kapaService.get<ApiResponse<PaginatedSystemEvents>>(
    '/users/me/events',
    {
      params: {
        page,
        limit,
        ...(type ? { type } : {}),
      },
    },
  );

  return response.data.data;
}

export function useUserEvents(params: UseUserEventsParams = {}) {
  const { isLogged } = useAuth();
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const type = params.type;

  return useQuery({
    queryKey: ['user', 'events', { page, limit, type: type ?? 'ALL' }],
    queryFn: () => fetchUserEvents({ page, limit, type }),
    enabled: isLogged,
    retry: (failureCount, error) => {
      if (isAxiosError(error) && error.response) {
        const status = error.response.status;
        if (status === 401 || status === 403 || status === 404) {
          return false;
        }
      }
      return failureCount < 2;
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}
