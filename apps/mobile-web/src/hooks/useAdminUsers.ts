import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiResponse, User, UserRole } from '@kapa/shared';
import { kapaService } from '@/services/kapaService';

const ADMIN_USERS_KEY = ['users', 'admin'] as const;

export function useAdminUsers(enabled = true) {
  return useQuery({
    queryKey: ADMIN_USERS_KEY,
    enabled,
    queryFn: async () => {
      const response = await kapaService.get<ApiResponse<User[]>>('/users/all');
      return response.data.data;
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: UserRole }) => {
      const response = await kapaService.patch<ApiResponse<User>>(
        `/users/${id}/role`,
        { role },
      );
      return response.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const response = await kapaService.patch<ApiResponse<User>>(
        `/users/${id}/status`,
        { active },
      );
      return response.data.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_KEY });
    },
  });
}
