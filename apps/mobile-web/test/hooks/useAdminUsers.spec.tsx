import React, { type ReactNode } from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { User } from '@kapa/shared';
import {
  useAdminUsers,
  useUpdateUserRole,
  useUpdateUserStatus,
} from '@/hooks/useAdminUsers';
import { kapaService } from '@/services/kapaService';

jest.mock('@/services/kapaService', () => ({
  kapaService: { get: jest.fn(), patch: jest.fn() },
}));

const mockedGet = jest.mocked(kapaService.get);
const mockedPatch = jest.mocked(kapaService.patch);

const USER: User = {
  id: 'user-1',
  role: 'adopter',
  rules: [],
  username: 'Julia',
  email: 'julia@kapa.test',
  createdAt: '2026-11-01T10:00:00.000Z',
  deactivatedAt: null,
};

function buildWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper, invalidate };
}

describe('hooks de administração de usuários', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('useAdminUsers carrega a lista de /users/all', async () => {
    mockedGet.mockResolvedValue({ data: { data: [USER] } });
    const { wrapper } = buildWrapper();

    const { result } = await renderHook(() => useAdminUsers(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual([USER]));
    expect(mockedGet).toHaveBeenCalledWith('/users/all');
  });

  it('useAdminUsers não consulta a API quando está desabilitado', async () => {
    const { wrapper } = buildWrapper();

    await renderHook(() => useAdminUsers(false), { wrapper });

    expect(mockedGet).not.toHaveBeenCalled();
  });

  it('useUpdateUserRole envia o papel e atualiza a lista', async () => {
    mockedPatch.mockResolvedValue({ data: { data: { ...USER, role: 'volunteer' } } });
    const { wrapper, invalidate } = buildWrapper();
    const { result } = await renderHook(() => useUpdateUserRole(), { wrapper });

    result.current.mutate({ id: 'user-1', role: 'volunteer' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedPatch).toHaveBeenCalledWith('/users/user-1/role', { role: 'volunteer' });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['users', 'admin'] });
  });

  it('useUpdateUserStatus envia o status e atualiza a lista', async () => {
    mockedPatch.mockResolvedValue({
      data: { data: { ...USER, deactivatedAt: '2026-11-10T10:00:00.000Z' } },
    });
    const { wrapper, invalidate } = buildWrapper();
    const { result } = await renderHook(() => useUpdateUserStatus(), { wrapper });

    result.current.mutate({ id: 'user-1', active: false });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedPatch).toHaveBeenCalledWith('/users/user-1/status', { active: false });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['users', 'admin'] });
  });
});
