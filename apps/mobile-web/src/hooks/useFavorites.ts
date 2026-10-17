import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse } from '@kapa/shared';
import { kapaService } from '@/services/kapaService';

type ToggleFavoriteResponse = { favorited: boolean };

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (animalId: string) => {
      const response = await kapaService.post<ApiResponse<ToggleFavoriteResponse>>('/favorites', { animalId });
      return response.data.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['user', 'profile'] }),
  });
}
