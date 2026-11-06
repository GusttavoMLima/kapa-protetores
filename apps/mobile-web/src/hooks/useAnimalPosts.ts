import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import type { AnimalPost, ApiResponse } from '@kapa/shared';
import { kapaService } from '@/services/kapaService';

export async function fetchAnimalPosts(animalId: string): Promise<AnimalPost[]> {
  const response = await kapaService.get<ApiResponse<AnimalPost[]>>(
    `/animals/${animalId}/posts`,
  );
  if (response.data && Array.isArray(response.data.data)) {
    return response.data.data;
  }
  return [];
}

export function useAnimalPosts(animalId: string | undefined) {
  return useQuery<AnimalPost[], Error>({
    queryKey: ['animals', 'posts', animalId],
    queryFn: () => fetchAnimalPosts(animalId!),
    enabled: Boolean(animalId),
    staleTime: 1000 * 60,
    retry: (failureCount, error) => {
      if (isAxiosError(error) && error.response) {
        const status = error.response.status;
        if (status === 401 || status === 403 || status === 404) {
          return false;
        }
      }
      return failureCount < 2;
    },
  });
}

export function useCreateAnimalPost(animalId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (description: string) => {
      if (!animalId) {
        throw new Error('Animal não identificado.');
      }
      const response = await kapaService.post<ApiResponse<AnimalPost>>(
        `/animals/${animalId}/posts`,
        { description },
      );
      return response.data.data;
    },
    onSuccess: () => {
      if (animalId) {
        void queryClient.invalidateQueries({
          queryKey: ['animals', 'posts', animalId],
        });
      }
    },
  });
}
