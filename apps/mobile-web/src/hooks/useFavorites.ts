import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, UserWithCountAndDataOfRelations } from '@kapa/shared';
import { kapaService } from '@/services/kapaService';

type ToggleFavoriteResponse = { favorited: boolean };

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (animalId: string) => {
      const response = await kapaService.post<ApiResponse<ToggleFavoriteResponse>>('/favorites', { animalId });
      return response.data.data;
    },
    onMutate: async (animalId: string) => {
      await queryClient.cancelQueries({ queryKey: ['user', 'profile'] });
      const previousProfile = queryClient.getQueryData<UserWithCountAndDataOfRelations>(['user', 'profile']);

      if (previousProfile) {
        const exists = previousProfile.favorites.some((fav) => fav.animalId === animalId);
        const nextFavorites = exists
          ? previousProfile.favorites.filter((fav) => fav.animalId !== animalId)
          : [
              ...previousProfile.favorites,
              {
                userId: previousProfile.id,
                animalId,
                createdAt: new Date().toISOString(),
              },
            ];

        queryClient.setQueryData<UserWithCountAndDataOfRelations>(['user', 'profile'], {
          ...previousProfile,
          favorites: nextFavorites,
          counts: {
            ...previousProfile.counts,
            favorites: nextFavorites.length,
          },
        });
      }

      return { previousProfile };
    },
    onError: (_err, _animalId, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(['user', 'profile'], context.previousProfile);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      void queryClient.invalidateQueries({ queryKey: ['user', 'events'] });
    },
  });
}
