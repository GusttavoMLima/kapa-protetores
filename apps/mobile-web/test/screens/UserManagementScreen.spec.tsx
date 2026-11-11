import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { User } from '@kapa/shared';
import {
  UserManagementScreen,
  filterUsers,
  readApiErrorMessage,
} from '@/screens/userManagement';
import { buildStaffHomeCards } from '@/screens/home';
import { useAuth } from '@/hooks/useAuth';
import {
  useAdminUsers,
  useUpdateUserRole,
  useUpdateUserStatus,
} from '@/hooks/useAdminUsers';

jest.mock('expo-router', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    router: { replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) },
    Redirect: ({ href }: { href: string }) => <Text>{`redirect:${href}`}</Text>,
  };
});

jest.mock('@/hooks/useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('@/hooks/useAdminUsers', () => ({
  useAdminUsers: jest.fn(),
  useUpdateUserRole: jest.fn(),
  useUpdateUserStatus: jest.fn(),
}));

const mockedUseAuth = jest.mocked(useAuth);
const mockedUseAdminUsers = jest.mocked(useAdminUsers);
const mockedUseUpdateUserRole = jest.mocked(useUpdateUserRole);
const mockedUseUpdateUserStatus = jest.mocked(useUpdateUserStatus);

function buildUser(overrides: Partial<User>): User {
  return {
    id: 'user-x',
    role: 'adopter',
    rules: [],
    username: 'Pessoa',
    email: 'pessoa@kapa.test',
    createdAt: '2026-11-01T10:00:00.000Z',
    deactivatedAt: null,
    ...overrides,
  };
}

const ADMIN = buildUser({ id: 'admin-1', role: 'admin', username: 'Admin Kapa', email: 'admin@kapa.test' });
const JULIA = buildUser({ id: 'user-1', username: 'Julia Barbosa', email: 'julia@kapa.test' });
const DANILO = buildUser({
  id: 'user-2',
  role: 'volunteer',
  username: 'Danilo Santos',
  email: 'danilo@kapa.test',
  deactivatedAt: '2026-11-05T10:00:00.000Z',
});

describe('UserManagementScreen', () => {
  const roleMutate = jest.fn();
  const statusMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ user: ADMIN } as unknown as ReturnType<typeof useAuth>);
    mockedUseAdminUsers.mockReturnValue({
      data: [ADMIN, JULIA, DANILO],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useAdminUsers>);
    mockedUseUpdateUserRole.mockReturnValue({
      mutate: roleMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateUserRole>);
    mockedUseUpdateUserStatus.mockReturnValue({
      mutate: statusMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateUserStatus>);
  });

  it('redireciona quem não é administrador', async () => {
    mockedUseAuth.mockReturnValue({
      user: { ...ADMIN, role: 'adopter' },
    } as unknown as ReturnType<typeof useAuth>);

    await render(<UserManagementScreen />);

    expect(screen.getByText('redirect:/(protected)/(tabs)')).toBeTruthy();
    expect(screen.queryByText('Gerenciar usuários')).toBeNull();
  });

  it('lista usuários com status e identifica a própria conta', async () => {
    await render(<UserManagementScreen />);

    expect(screen.getByText('Julia Barbosa')).toBeTruthy();
    expect(screen.getByText('Danilo Santos')).toBeTruthy();
    expect(screen.getByText('Desativado')).toBeTruthy();
    expect(screen.getByText('Você')).toBeTruthy();
  });

  it('filtra por busca e por papel', async () => {
    await render(<UserManagementScreen />);

    await fireEvent.changeText(
      screen.getByLabelText('Buscar usuário por nome ou e-mail'),
      'julia',
    );
    expect(screen.getByText('Julia Barbosa')).toBeTruthy();
    expect(screen.queryByText('Danilo Santos')).toBeNull();

    await fireEvent.changeText(
      screen.getByLabelText('Buscar usuário por nome ou e-mail'),
      '',
    );
    await fireEvent.press(screen.getAllByLabelText('Voluntário')[0]);
    expect(screen.queryByText('Julia Barbosa')).toBeNull();
    expect(screen.getByText('Danilo Santos')).toBeTruthy();
  });

  it('desativa uma conta somente depois da confirmação', async () => {
    await render(<UserManagementScreen />);

    await fireEvent.press(screen.getAllByLabelText('Desativar conta')[1]);
    expect(statusMutate).not.toHaveBeenCalled();
    expect(screen.getByText('Desativar conta?')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Desativar'));
    expect(statusMutate).toHaveBeenCalledWith(
      { id: 'user-1', active: false },
      expect.any(Object),
    );
  });

  it('reativa uma conta desativada', async () => {
    await render(<UserManagementScreen />);

    await fireEvent.press(screen.getByLabelText('Reativar conta'));
    await fireEvent.press(screen.getByLabelText('Reativar'));

    expect(statusMutate).toHaveBeenCalledWith(
      { id: 'user-2', active: true },
      expect.any(Object),
    );
  });

  it('altera o papel depois da confirmação e permite cancelar', async () => {
    await render(<UserManagementScreen />);

    await fireEvent.press(screen.getAllByLabelText('Administrador')[2]);
    await fireEvent.press(screen.getByLabelText('Cancelar'));
    expect(roleMutate).not.toHaveBeenCalled();

    await fireEvent.press(screen.getAllByLabelText('Administrador')[2]);
    await fireEvent.press(screen.getByLabelText('Alterar papel'));
    expect(roleMutate).toHaveBeenCalledWith(
      { id: 'user-1', role: 'admin' },
      expect.any(Object),
    );
  });

  it('mostra o aviso de sucesso depois de alterar papel, desativar e reativar', async () => {
    type Options = { onSuccess: () => void };
    roleMutate.mockImplementation((_vars: unknown, options: Options) => options.onSuccess());
    statusMutate.mockImplementation((_vars: unknown, options: Options) => options.onSuccess());
    await render(<UserManagementScreen />);

    await fireEvent.press(screen.getAllByLabelText('Administrador')[2]);
    await fireEvent.press(screen.getByLabelText('Alterar papel'));
    expect(screen.getByText('Papel de Julia Barbosa atualizado.')).toBeTruthy();

    await fireEvent.press(screen.getAllByLabelText('Desativar conta')[1]);
    await fireEvent.press(screen.getByLabelText('Desativar'));
    expect(screen.getByText('Julia Barbosa foi desativado.')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Reativar conta'));
    await fireEvent.press(screen.getByLabelText('Reativar'));
    expect(screen.getByText('Danilo Santos foi reativado.')).toBeTruthy();
  });

  it('mostra a mensagem da API quando a ação falha', async () => {
    type Options = { onError: (error: unknown) => void };
    statusMutate.mockImplementation((_vars: unknown, options: Options) =>
      options.onError({
        response: { data: { message: 'Não é possível remover o último administrador' } },
      }),
    );
    await render(<UserManagementScreen />);

    await fireEvent.press(screen.getAllByLabelText('Desativar conta')[1]);
    await fireEvent.press(screen.getByLabelText('Desativar'));

    expect(screen.getByText('Não é possível remover o último administrador')).toBeTruthy();
  });

  it('volta a mostrar todos os papéis ao limpar o filtro', async () => {
    await render(<UserManagementScreen />);

    await fireEvent.press(screen.getAllByLabelText('Voluntário')[0]);
    expect(screen.queryByText('Julia Barbosa')).toBeNull();

    await fireEvent.press(screen.getByLabelText('Todos'));
    expect(screen.getByText('Julia Barbosa')).toBeTruthy();
  });

  it('bloqueia as ações sobre a própria conta', async () => {
    mockedUseAdminUsers.mockReturnValue({
      data: [ADMIN],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useAdminUsers>);

    await render(<UserManagementScreen />);

    await fireEvent.press(screen.getByLabelText('Desativar conta'));
    expect(screen.queryByText('Desativar conta?')).toBeNull();
    expect(statusMutate).not.toHaveBeenCalled();
    expect(
      screen.getByText('Você não pode alterar a sua própria conta por aqui.'),
    ).toBeTruthy();
  });

  it('mostra carregamento, erro e lista vazia', async () => {
    mockedUseAdminUsers.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as unknown as ReturnType<typeof useAdminUsers>);
    const { rerender } = await render(<UserManagementScreen />);
    expect(screen.getByText('Carregando usuários...')).toBeTruthy();

    mockedUseAdminUsers.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('falha'),
    } as unknown as ReturnType<typeof useAdminUsers>);
    await rerender(<UserManagementScreen />);
    expect(screen.getByText(/Não foi possível carregar os usuários/)).toBeTruthy();

    mockedUseAdminUsers.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof useAdminUsers>);
    await rerender(<UserManagementScreen />);
    expect(screen.getByText('Nenhum usuário encontrado')).toBeTruthy();
  });
});

describe('helpers da gestão de usuários', () => {
  it('filterUsers combina busca e papel sem diferenciar maiúsculas', async () => {
    const users = [ADMIN, JULIA, DANILO];

    expect(filterUsers(users, 'DANILO', 'all')).toEqual([DANILO]);
    expect(filterUsers(users, '', 'admin')).toEqual([ADMIN]);
    expect(filterUsers(users, 'julia', 'admin')).toEqual([]);
  });

  it('readApiErrorMessage usa a mensagem da API ou um texto padrão', async () => {
    expect(
      readApiErrorMessage({ response: { data: { message: 'Mensagem da API' } } }),
    ).toBe('Mensagem da API');
    expect(readApiErrorMessage(new Error('x'))).toMatch(/Não foi possível concluir/);
  });
});

describe('cartão de gestão de usuários na home', () => {
  it('aparece somente para administradores', () => {
    const adminCards = buildStaffHomeCards('admin');
    const userCard = adminCards.find((card) => card.title === 'Usuários');

    expect(userCard?.link?.href).toBe('/(protected)/gestao/usuarios');
    expect(
      buildStaffHomeCards('protector').some((card) => card.title === 'Usuários'),
    ).toBe(false);
    expect(buildStaffHomeCards('adopter')).toEqual([]);
  });
});
