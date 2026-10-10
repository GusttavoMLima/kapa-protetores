import { isAxiosError } from 'axios';
import { kapaService } from '@/services/kapaService';
import { useAuth } from '@/hooks/useAuth';
import type {
  ApiResponse,
  UserWithCountAndDataOfRelations,
} from '@kapa/shared';
import { useQuery } from '@tanstack/react-query';

async function fetchProfileData(): Promise<UserWithCountAndDataOfRelations> {
  const response = await kapaService.get<
    ApiResponse<UserWithCountAndDataOfRelations>
  >('/users/me/profile');

  return response.data.data;
}

export const useUserProfile = () => {
  const { isLogged } = useAuth();

  return useQuery({
    queryKey: ['user', 'profile'],
    queryFn: fetchProfileData,
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
    retryDelay: 800,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnWindowFocus: false,
  });
};

