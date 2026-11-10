import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  Adoption,
  ApiResponse,
  CreateAdoptionInput,
  UpdateAdoptionStatusInput,
} from '@kapa/shared';
import { kapaService } from '@/services/kapaService';

async function createAdoption(input: CreateAdoptionInput): Promise<Adoption> {
  const response = await kapaService.post<ApiResponse<Adoption>>('/adoptions', input);

  return response.data.data;
}

export function useCreateAdoption() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createAdoption,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['adoptions', 'mine'] });
      void queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      void queryClient.invalidateQueries({ queryKey: ['user', 'events'] });
    },
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
    mutationFn: async ({ id, ...input }: { id: string } & UpdateAdoptionStatusInput) => {
      const response = await kapaService.patch<ApiResponse<Adoption>>(`/adoptions/${id}/status`, input);
      return response.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['adoptions', 'admin'] });
      void queryClient.invalidateQueries({ queryKey: ['adoptions', 'mine'] });
      void queryClient.invalidateQueries({ queryKey: ['animals', 'adopt'] });
    },
  });
}

async function uploadSignedContract(input: {
  id: string;
  file: File;
}): Promise<Adoption> {
  const form = new FormData();
  form.append('contract', input.file);
  const response = await kapaService.post<ApiResponse<Adoption>>(
    `/adoptions/${input.id}/signed-contract`,
    form,
  );
  return response.data.data;
}

export function useUploadSignedContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: uploadSignedContract,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['adoptions', 'admin'] });
      void queryClient.invalidateQueries({ queryKey: ['adoptions', 'mine'] });
    },
  });
}

export async function downloadSignedContract(
  id: string,
  fileName: string,
): Promise<boolean> {
  if (typeof document === 'undefined') return false;

  const response = await kapaService.get(`/adoptions/${id}/signed-contract`, {
    responseType: 'blob',
  });
  const objectUrl = URL.createObjectURL(response.data as Blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(objectUrl);
  return true;
}

export async function openSignedContract(id: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const response = await kapaService.get(`/adoptions/${id}/signed-contract`, {
    responseType: 'blob',
  });
  const objectUrl = URL.createObjectURL(response.data as Blob);
  const preview = window.open(objectUrl, '_blank');
  if (!preview) {
    URL.revokeObjectURL(objectUrl);
    return false;
  }
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  return true;
}
