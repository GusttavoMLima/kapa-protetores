import { fireEvent, render, screen } from '@testing-library/react-native';
import type { VolunteerApplication } from '@kapa/shared';
import { VolunteerRequestsScreen } from '@/screens/volunteerRequests';
import { countVolunteerApplications, filterVolunteerApplications } from '@/screens/volunteerRequests/model';
import { useAuth } from '@/hooks/useAuth';
import {
  useAdminVolunteerApplications,
  useUpdateVolunteerApplicationStatus,
} from '@/hooks/useVolunteerApplications';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => false) },
  Redirect: ({ href }: { href: string }) => {
    const { Text } = jest.requireActual('react-native');
    return <Text>{`redirect:${href}`}</Text>;
  },
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});
jest.mock('@/hooks/useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('@/hooks/useVolunteerApplications', () => ({
  useAdminVolunteerApplications: jest.fn(),
  useUpdateVolunteerApplicationStatus: jest.fn(),
}));

const app = (id: string, fullName: string, status: VolunteerApplication['status'], appliedAt: string): VolunteerApplication => ({
  id,
  userId: `u-${id}`,
  status,
  appliedAt,
  application: { fullName, phone: '11999998888', areasOfInterest: ['animal_care'], availability: 'weekends', motivation: 'Quero ajudar', acceptsTerms: true },
  user: { id: `u-${id}`, username: fullName, email: `${id}@kapa.test`, role: 'adopter' },
} as unknown as VolunteerApplication);

const applications = [
  app('a', 'Ana Souza', 'approved', '2026-11-01T10:00:00.000Z'),
  app('b', 'Bruno Lima', 'pending', '2026-11-03T10:00:00.000Z'),
  app('c', 'Cecília Reis', 'rejected', '2026-11-02T10:00:00.000Z'),
  app('d', 'Davi Melo', 'pending', '2026-11-05T10:00:00.000Z'),
];

const mockedUseAuth = jest.mocked(useAuth);
const mockedList = jest.mocked(useAdminVolunteerApplications);
const mockedUpdate = jest.mocked(useUpdateVolunteerApplicationStatus);
const mutate = jest.fn();
const refetch = jest.fn();

function setList(state: Partial<ReturnType<typeof useAdminVolunteerApplications>>) {
  mockedList.mockReturnValue({ data: applications, isLoading: false, error: null, refetch, ...state } as unknown as ReturnType<typeof useAdminVolunteerApplications>);
}

describe('modelo das candidaturas de voluntários', () => {
  it('filtra por status e por nome ignorando acentos, com pendentes primeiro', () => {
    expect(filterVolunteerApplications(applications, 'all', '').map((a) => a.id)).toEqual(['d', 'b', 'a', 'c']);
    expect(filterVolunteerApplications(applications, 'pending', '').map((a) => a.id)).toEqual(['d', 'b']);
    expect(filterVolunteerApplications(applications, 'all', 'cecilia').map((a) => a.id)).toEqual(['c']);
    expect(filterVolunteerApplications(applications, 'approved', 'bruno')).toEqual([]);
  });

  it('conta as candidaturas por status', () => {
    expect(countVolunteerApplications(applications)).toEqual({ all: 4, pending: 2, approved: 1, rejected: 1 });
  });
});

describe('VolunteerRequestsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({ user: { role: 'admin' } } as unknown as ReturnType<typeof useAuth>);
    mockedUpdate.mockReturnValue({ mutate, isPending: false } as unknown as ReturnType<typeof useUpdateVolunteerApplicationStatus>);
    setList({});
  });

  it('redireciona quem não é da equipe', async () => {
    mockedUseAuth.mockReturnValue({ user: { role: 'adopter' } } as unknown as ReturnType<typeof useAuth>);
    await render(<VolunteerRequestsScreen />);

    expect(screen.getByText('redirect:/(protected)/(tabs)')).toBeTruthy();
  });

  it('mostra a contagem por status e filtra por situação e por nome', async () => {
    await render(<VolunteerRequestsScreen />);
    expect(screen.getByText('Pendentes (2)')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Aprovadas (1)'));
    expect(screen.getByText('Ana Souza')).toBeTruthy();
    expect(screen.queryByText('Bruno Lima')).toBeNull();

    await fireEvent.press(screen.getByLabelText('Todas (4)'));
    await fireEvent.changeText(screen.getByLabelText('Buscar candidatura por nome'), 'davi');
    expect(screen.getByText('Davi Melo')).toBeTruthy();
    expect(screen.queryByText('Ana Souza')).toBeNull();
  });

  it('mostra nenhum resultado e limpa os filtros', async () => {
    await render(<VolunteerRequestsScreen />);
    await fireEvent.changeText(screen.getByLabelText('Buscar candidatura por nome'), 'ninguém');

    expect(screen.getByText('Nenhuma candidatura encontrada')).toBeTruthy();
    await fireEvent.press(screen.getAllByLabelText('Limpar filtros')[0]);
    expect(screen.getByText('Ana Souza')).toBeTruthy();
  });

  it('mostra a lista vazia quando ainda não há candidaturas', async () => {
    setList({ data: [] });
    await render(<VolunteerRequestsScreen />);

    expect(screen.getByText('Nenhuma candidatura recebida ainda')).toBeTruthy();
  });

  it('mostra o carregamento', async () => {
    setList({ data: undefined, isLoading: true });
    await render(<VolunteerRequestsScreen />);

    expect(screen.getByText('Carregando candidaturas…')).toBeTruthy();
  });

  it('oferece tentar novamente quando a lista falha', async () => {
    setList({ data: undefined, error: new Error('falhou') as never });
    await render(<VolunteerRequestsScreen />);

    await fireEvent.press(screen.getByLabelText('Tentar novamente'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('aprova e recusa mostrando a mensagem de resultado', async () => {
    mutate.mockImplementation((_vars, options: { onSuccess: () => void }) => options.onSuccess());
    await render(<VolunteerRequestsScreen />);

    await fireEvent.press(screen.getAllByLabelText('Aprovar voluntário')[0]);
    expect(mutate).toHaveBeenCalledWith({ id: 'd', status: 'approved' }, expect.any(Object));
    expect(screen.getByText('Candidatura de Davi Melo aprovada.')).toBeTruthy();

    mutate.mockImplementation((_vars, options: { onError: () => void }) => options.onError());
    await fireEvent.press(screen.getAllByLabelText('Recusar candidatura')[0]);
    expect(screen.getByText('Não foi possível atualizar a candidatura. Tente novamente.')).toBeTruthy();
  });
});
