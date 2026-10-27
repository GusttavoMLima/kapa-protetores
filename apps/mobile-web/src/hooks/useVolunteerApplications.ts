import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  ApiResponse,
  VolunteerApplication,
  VolunteerApplicationData,
} from '@kapa/shared';
import { kapaService } from '@/services/kapaService';

async function createVolunteerApplication(
  input: VolunteerApplicationData,
): Promise<VolunteerApplication> {
  const response = await kapaService.post<ApiResponse<VolunteerApplication>>(
    '/volunteer-applications',
    input,
  );
  return response.data.data;
}

export function useCreateVolunteerApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVolunteerApplication,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['volunteer-applications', 'mine'],
      });
      void queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      void queryClient.invalidateQueries({ queryKey: ['user', 'events'] });
    },
  });
}

export function useMyVolunteerApplication(enabled = true) {
  return useQuery({
    queryKey: ['volunteer-applications', 'mine'],
    enabled,
    queryFn: async () => {
      const response = await kapaService.get<
        ApiResponse<VolunteerApplication | null>
      >('/volunteer-applications/mine');
      return response.data.data;
    },
  });
}

export function useAdminVolunteerApplications() {
  return useQuery({
    queryKey: ['volunteer-applications', 'admin'],
    queryFn: async () => {
      const response = await kapaService.get<
        ApiResponse<VolunteerApplication[]>
      >('/volunteer-applications');
      return response.data.data;
    },
  });
}

export function useUpdateVolunteerApplicationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: 'approved' | 'rejected';
    }) => {
      const response = await kapaService.patch<
        ApiResponse<VolunteerApplication>
      >(`/volunteer-applications/${id}/status`, { status });
      return response.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['volunteer-applications', 'admin'],
      });
    },
  });
}
