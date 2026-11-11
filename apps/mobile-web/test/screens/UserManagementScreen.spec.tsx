import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { User } from '@kapa/shared';
import { UserManagementScreen } from '@/screens/userManagement';
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

const ADMIN = buildUser({
  id: 'admin-1',
  role: 'admin',
  username: 'Admin Kapa',
  email: 'admin@kapa.test',
  createdAt: '2026-11-04T10:00:00.000Z',
});
const JULIA = buildUser({
  id: 'user-1',
  username: 'Júlia Barbosa',
  email: 'julia@kapa.test',
  createdAt: '2026-11-03T10:00:00.000Z',
});
const DANILO = buildUser({
  id: 'user-2',
  role: 'volunteer',
  username: 'Danilo Santos',
  email: 'danilo@kapa.test',
  createdAt: '2026-11-02T10:00:00.000Z',
  deactivatedAt: '2026-11-05T10:00:00.000Z',
});

type Options = { onSuccess?: () => void; onError?: (error: unknown) => void };

describe('UserManagementScreen', () => {
  const roleMutate = jest.fn();
  const statusMutate = jest.fn();
  const refetch = jest.fn();

  function mockUsers(data: User[] | undefined, extra: Record<string, unknown> = {}) {
    mockedUseAdminUsers.mockReturnValue({
      data,
      isLoading: false,
      error: null,
      refetch,
      ...extra,
    } as unknown as ReturnType<typeof useAdminUsers>);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ user: ADMIN } as unknown as ReturnType<typeof useAuth>);
    mockUsers([ADMIN, JULIA, DANILO]);
    mockedUseUpdateUserRole.mockReturnValue({
      mutate: roleMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateUserRole>);
    mockedUseUpdateUserStatus.mockReturnValue({
      mutate: statusMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateUserStatus>);
  });

  describe('lista', () => {
    it('redireciona quem não é administrador', async () => {
      mockedUseAuth.mockReturnValue({
        user: { ...ADMIN, role: 'adopter' },
      } as unknown as ReturnType<typeof useAuth>);

      await render(<UserManagementScreen />);

      expect(screen.getByText('redirect:/(protected)/(tabs)')).toBeTruthy();
      expect(screen.queryByText('Gerenciar usuários')).toBeNull();
    });

    it('mostra o resumo por papel e os usuários com papel, situação e cadastro', async () => {
      await render(<UserManagementScreen />);

      expect(screen.getByLabelText('Todos os usuários: 3')).toBeTruthy();
      expect(screen.getByLabelText('Administradores: 1')).toBeTruthy();
      expect(screen.getByLabelText('Voluntários: 1')).toBeTruthy();
      expect(screen.getByLabelText('Adotantes: 1')).toBeTruthy();
      expect(screen.getByLabelText('Protetores: 0')).toBeTruthy();
      expect(screen.getByText('Júlia Barbosa')).toBeTruthy();
      expect(screen.getByText('Desativado')).toBeTruthy();
      expect(screen.getAllByText('Ativo')).toHaveLength(2);
      expect(screen.getByText('Você')).toBeTruthy();
      expect(screen.getByText('1–3 de 3 usuários')).toBeTruthy();
    });

    it('mostra as mais recentes primeiro e ordena por nome sob demanda', async () => {
      await render(<UserManagementScreen />);
      const order = () =>
        screen
          .getAllByLabelText(/^Gerenciar /)
          .map((element) => element.props.accessibilityLabel);

      expect(order()).toEqual([
        'Gerenciar Admin Kapa',
        'Gerenciar Júlia Barbosa',
        'Gerenciar Danilo Santos',
      ]);

      await fireEvent.press(screen.getByLabelText('Nome A–Z'));

      expect(order()).toEqual([
        'Gerenciar Admin Kapa',
        'Gerenciar Danilo Santos',
        'Gerenciar Júlia Barbosa',
      ]);
    });

    it('filtra pelo cartão de papel e limpa os filtros', async () => {
      await render(<UserManagementScreen />);

      await fireEvent.press(screen.getByLabelText('Voluntários: 1'));
      expect(screen.queryByText('Júlia Barbosa')).toBeNull();
      expect(screen.getByText('Danilo Santos')).toBeTruthy();

      await fireEvent.press(screen.getByLabelText('Limpar filtros'));
      expect(screen.getByText('Júlia Barbosa')).toBeTruthy();
      expect(screen.queryByLabelText('Limpar filtros')).toBeNull();
    });

    it('filtra por situação', async () => {
      await render(<UserManagementScreen />);

      await fireEvent.press(screen.getByLabelText('Desativadas'));
      expect(screen.queryByText('Júlia Barbosa')).toBeNull();
      expect(screen.getByText('Danilo Santos')).toBeTruthy();

      await fireEvent.press(screen.getByLabelText('Ativas'));
      expect(screen.getByText('Júlia Barbosa')).toBeTruthy();
      expect(screen.queryByText('Danilo Santos')).toBeNull();
    });

    it('busca ignorando acentos e mostra o estado vazio com opção de limpar', async () => {
      await render(<UserManagementScreen />);
      const search = screen.getByLabelText('Buscar usuário por nome ou e-mail');

      await fireEvent.changeText(search, 'julia');
      expect(screen.getByText('Júlia Barbosa')).toBeTruthy();
      expect(screen.queryByText('Danilo Santos')).toBeNull();

      await fireEvent.changeText(search, 'ninguem');
      expect(screen.getByText('Nenhum usuário encontrado')).toBeTruthy();

      await fireEvent.press(screen.getAllByLabelText('Limpar filtros')[0]);
      expect(screen.getByText('Danilo Santos')).toBeTruthy();
    });

    it('pagina de 10 em 10 e volta para a primeira página ao filtrar', async () => {
      const many = Array.from({ length: 13 }, (_, index) =>
        buildUser({
          id: `many-${index}`,
          username: `Pessoa ${String(index).padStart(2, '0')}`,
          email: `pessoa${index}@kapa.test`,
          createdAt: `2026-10-${String(index + 1).padStart(2, '0')}T10:00:00.000Z`,
        }),
      );
      mockUsers([ADMIN, ...many]);
      await render(<UserManagementScreen />);

      expect(screen.getByText('1–10 de 14 usuários')).toBeTruthy();
      expect(screen.getByText('1 / 2')).toBeTruthy();

      await fireEvent.press(screen.getByLabelText('Próxima'));
      expect(screen.getByText('11–14 de 14 usuários')).toBeTruthy();

      await fireEvent.press(screen.getByLabelText('Nome A–Z'));
      expect(screen.getByText('1–10 de 14 usuários')).toBeTruthy();

      await fireEvent.press(screen.getByLabelText('Próxima'));
      await fireEvent.press(screen.getByLabelText('Anterior'));
      expect(screen.getByText('1 / 2')).toBeTruthy();
    });

    it('mostra carregamento, erro com nova tentativa e lista vazia', async () => {
      mockUsers(undefined, { isLoading: true });
      const { rerender } = await render(<UserManagementScreen />);
      expect(screen.getByText('Carregando usuários…')).toBeTruthy();

      mockUsers(undefined, { error: new Error('falha') });
      await rerender(<UserManagementScreen />);
      expect(screen.getByText(/Não foi possível carregar os usuários/)).toBeTruthy();
      await fireEvent.press(screen.getByLabelText('Tentar novamente'));
      expect(refetch).toHaveBeenCalledTimes(1);

      mockUsers([]);
      await rerender(<UserManagementScreen />);
      expect(screen.getByText('Nenhum usuário cadastrado ainda')).toBeTruthy();
    });
  });

  describe('painel Gerenciar usuário', () => {
    async function openJulia() {
      await render(<UserManagementScreen />);
      await fireEvent.press(screen.getByLabelText('Gerenciar Júlia Barbosa'));
    }

    it('abre com os dados da pessoa e fecha pelo botão', async () => {
      await openJulia();

      // a linha da lista e o painel mostram o mesmo e-mail e a mesma data
      expect(screen.getAllByText('julia@kapa.test')).toHaveLength(2);
      expect(screen.getAllByText('Cadastro em 03/11/2026')).toHaveLength(2);

      await fireEvent.press(screen.getByLabelText('Fechar'));
      expect(screen.getAllByText('Cadastro em 03/11/2026')).toHaveLength(1);
    });

    it('só permite salvar o papel quando ele muda e mostra o aviso de sucesso', async () => {
      roleMutate.mockImplementation((_vars: unknown, options: Options) => options.onSuccess?.());
      await openJulia();

      await fireEvent.press(screen.getByText('Salvar papel'));
      expect(roleMutate).not.toHaveBeenCalled();

      await fireEvent.press(screen.getByLabelText('Voluntário'));
      await fireEvent.press(screen.getByText('Salvar papel'));

      expect(roleMutate).toHaveBeenCalledWith(
        { id: 'user-1', role: 'volunteer' },
        expect.any(Object),
      );
      expect(
        screen.getByText('Papel de Júlia Barbosa atualizado para voluntário.'),
      ).toBeTruthy();
      expect(screen.getAllByText('Cadastro em 03/11/2026')).toHaveLength(1);
    });

    it('desativa em duas etapas e permite voltar atrás', async () => {
      statusMutate.mockImplementation((_vars: unknown, options: Options) => options.onSuccess?.());
      await openJulia();

      await fireEvent.press(screen.getByLabelText('Desativar conta'));
      expect(statusMutate).not.toHaveBeenCalled();
      expect(screen.getByText('Confirma desativar a conta de Júlia Barbosa?')).toBeTruthy();

      await fireEvent.press(screen.getByLabelText('Voltar'));
      expect(screen.queryByLabelText('Confirmar desativação')).toBeNull();

      await fireEvent.press(screen.getByLabelText('Desativar conta'));
      await fireEvent.press(screen.getByLabelText('Confirmar desativação'));

      expect(statusMutate).toHaveBeenCalledWith(
        { id: 'user-1', active: false },
        expect.any(Object),
      );
      expect(screen.getByText('Júlia Barbosa foi desativado.')).toBeTruthy();
    });

    it('reativa uma conta desativada direto, sem confirmação extra', async () => {
      statusMutate.mockImplementation((_vars: unknown, options: Options) => options.onSuccess?.());
      await render(<UserManagementScreen />);

      await fireEvent.press(screen.getByLabelText('Gerenciar Danilo Santos'));
      await fireEvent.press(screen.getByLabelText('Reativar conta'));

      expect(statusMutate).toHaveBeenCalledWith(
        { id: 'user-2', active: true },
        expect.any(Object),
      );
      expect(screen.getByText('Danilo Santos foi reativado.')).toBeTruthy();
    });

    it('mostra o erro da API dentro do painel e mantém o painel aberto', async () => {
      statusMutate.mockImplementation((_vars: unknown, options: Options) =>
        options.onError?.({
          response: { data: { message: 'Não é possível remover o último administrador' } },
        }),
      );
      await openJulia();

      await fireEvent.press(screen.getByLabelText('Desativar conta'));
      await fireEvent.press(screen.getByLabelText('Confirmar desativação'));

      expect(screen.getByText('Não é possível remover o último administrador')).toBeTruthy();
      expect(screen.getAllByText('Cadastro em 03/11/2026')).toHaveLength(2);
    });

    it('mostra o erro ao falhar a troca de papel', async () => {
      roleMutate.mockImplementation((_vars: unknown, options: Options) =>
        options.onError?.(new Error('falha')),
      );
      await openJulia();

      await fireEvent.press(screen.getByLabelText('Protetor'));
      await fireEvent.press(screen.getByText('Salvar papel'));

      expect(screen.getByText(/Não foi possível concluir a ação/)).toBeTruthy();
    });

    it('bloqueia as ações sobre a própria conta', async () => {
      await render(<UserManagementScreen />);

      await fireEvent.press(screen.getByLabelText('Gerenciar Admin Kapa'));
      expect(
        screen.getByText('Você não pode alterar a sua própria conta por aqui.'),
      ).toBeTruthy();

      await fireEvent.press(screen.getByLabelText('Desativar conta'));
      await fireEvent.press(screen.getByLabelText('Adotante'));
      await fireEvent.press(screen.getByText('Salvar papel'));

      expect(screen.queryByLabelText('Confirmar desativação')).toBeNull();
      expect(statusMutate).not.toHaveBeenCalled();
      expect(roleMutate).not.toHaveBeenCalled();
    });
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
