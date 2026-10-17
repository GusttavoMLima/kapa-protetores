import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Adoption, ApiResponse, CreateAdoptionInput } from '@kapa/shared';
import { kapaService } from '@/services/kapaService';

async function createAdoption(input: CreateAdoptionInput): Promise<Adoption> {
  const response = await kapaService.post<ApiResponse<Adoption>>('/adoptions', input);

  return response.data.data;
}

export function useCreateAdoption() {
  return useMutation({
    mutationFn: createAdoption,
  });
}

export function useAdminAdoptions() {
  return useQuery({
    queryKey: ['adoptions', 'admin'],
    queryFn: async () => {
      const response = await kapaService.get<ApiResponse<Adoption[]>>('/adoptions');
      return response.data.data;
    },
  });
}

export function useMyAdoptions() {
  return useQuery({
    queryKey: ['adoptions', 'mine'],
    queryFn: async () => {
      const response = await kapaService.get<ApiResponse<Adoption[]>>('/adoptions/mine');
      return response.data.data;
    },
  });
}

export function useUpdateAdoptionStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => {
      const response = await kapaService.patch<ApiResponse<Adoption>>(`/adoptions/${id}/status`, { status });
      return response.data.data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['adoptions', 'admin'] }),
  });
}
