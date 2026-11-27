import type { ReactNode } from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { FosterApplicationsScreen } from '@/screens/fosterCare/FosterApplicationsScreen';
import { fetchFosterApplications, reviewFosterApplication } from '@/services/fosterApplications';
import { apiRequest } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});
jest.mock('@/hooks/useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('@/services/api', () => ({ apiRequest: jest.fn() }));
jest.mock('@/services/fosterApplications', () => {
  const actual = jest.requireActual('../../src/services/fosterApplications');
  return { ...actual, fetchFosterApplications: jest.fn(), reviewFosterApplication: jest.fn() };
});
jest.mock('@/screens/fosterCare/FosterHomeDetails', () => ({ FosterHomeDetails: () => null }));

const now = new Date().toISOString();
const item = (id: string, username: string, status: 'pending' | 'approved' = 'pending') => ({
  id, status, availability: null, availableFrom: '2026-11-01', availableUntil: null, homeNotes: 'Quarto', homeAddress: 'Rua A',
  hasOtherAnimals: false, hasPerimeterBarrier: true, hasSecureGate: true, submittedAt: now, updatedAt: now,
  applicant: { username, email: `${id}@kapa.test` },
});

function renderScreen(children: ReactNode = <FosterApplicationsScreen />) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
  return render(<QueryClientProvider client={client}>{children}</QueryClientProvider>);
}

describe('FosterApplicationsScreen (admin)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAuth).mockReturnValue({ user: { id: 'staff', role: 'admin' } } as ReturnType<typeof useAuth>);
    jest.mocked(fetchFosterApplications).mockResolvedValue({ items: [item('c1', 'Maria')], total: 1, pageSize: 20 });
  });

  it('envia status e disponibilidade para a API e volta à primeira página', async () => {
    await renderScreen();
    await screen.findByText('Maria');

    await fireEvent.press(screen.getByLabelText('Em análise'));
    await fireEvent.press(screen.getByLabelText('Disponível agora'));

    expect(fetchFosterApplications).toHaveBeenLastCalledWith(1, { status: 'pending', availability: 'available' });
  });

  it('busca por nome depois que o usuário para de digitar', async () => {
    jest.useFakeTimers();
    try {
      await renderScreen();
      await fireEvent.changeText(screen.getByLabelText('Buscar candidatura de lar temporário por nome'), '  Maria ');
      await act(async () => { jest.advanceTimersByTime(300); });
      expect(fetchFosterApplications).toHaveBeenLastCalledWith(1, { search: 'Maria' });
    } finally {
      jest.useRealTimers();
    }
  });

  it('mostra nenhum resultado com filtros e limpa os filtros', async () => {
    jest.mocked(fetchFosterApplications).mockResolvedValue({ items: [], total: 0, pageSize: 20 });
    await renderScreen();
    await fireEvent.press(screen.getByLabelText('Recusadas'));

    expect(await screen.findByText('Nenhuma candidatura encontrada')).toBeTruthy();
    await fireEvent.press(screen.getAllByLabelText('Limpar filtros')[0]);
    expect(await screen.findByText('Nenhuma candidatura recebida ainda')).toBeTruthy();
  });

  it('oferece tentar novamente quando a lista falha', async () => {
    jest.mocked(fetchFosterApplications).mockRejectedValueOnce(new Error('falhou'));
    await renderScreen();

    await fireEvent.press(await screen.findByLabelText('Tentar novamente'));
    expect(await screen.findByText('Maria')).toBeTruthy();
  });

  it('confirma a recusa e mostra a mensagem de resultado', async () => {
    jest.mocked(reviewFosterApplication).mockResolvedValue(undefined);
    await renderScreen();

    expect(await screen.findByText('Recusar candidatura')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Recusar candidatura de Maria' }));
    expect(screen.getByText('Confirmar recusa?')).toBeTruthy();
    expect(reviewFosterApplication).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByLabelText('Confirmar decisão'));

    expect(await screen.findByText('Candidatura recusada.')).toBeTruthy();
    expect(reviewFosterApplication).toHaveBeenCalledWith('c1', 'rejected');
  });

  it('oferece recusa apenas para candidaturas em análise', async () => {
    jest.mocked(fetchFosterApplications).mockResolvedValue({
      items: [item('c1', 'Maria', 'approved'), item('c2', 'Ana')],
      total: 2,
      pageSize: 20,
    });
    await renderScreen();

    expect(await screen.findByRole('button', { name: 'Recusar candidatura de Ana' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Recusar candidatura de Maria' })).toBeNull();
  });

  it('mostra o erro da decisão sem fechar a lista', async () => {
    jest.mocked(reviewFosterApplication).mockRejectedValue(new Error('falhou'));
    await renderScreen();

    await fireEvent.press(await screen.findByLabelText('Aprovar candidatura de Maria'));
    await fireEvent.press(screen.getByLabelText('Confirmar decisão'));

    expect(await screen.findByText('Não foi possível registrar a decisão. Tente novamente.')).toBeTruthy();
  });

  it('pagina quando há mais de uma página', async () => {
    jest.mocked(fetchFosterApplications).mockResolvedValue({ items: [item('c1', 'Maria')], total: 25, pageSize: 20 });
    await renderScreen();

    expect(await screen.findByText('Página 1 de 2')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Próxima'));
    expect(fetchFosterApplications).toHaveBeenLastCalledWith(2, {});
  });
});

describe('fetchFosterApplications', () => {
  it('só envia os filtros preenchidos', async () => {
    const { fetchFosterApplications: realFetch } = jest.requireActual<typeof import('../../src/services/fosterApplications')>('../../src/services/fosterApplications');
    jest.mocked(apiRequest).mockResolvedValue({ items: [], total: 0, pageSize: 20 });

    await realFetch(1, { status: 'approved', search: 'ana' });
    expect(apiRequest).toHaveBeenLastCalledWith('/foster-applications?page=1&status=approved&search=ana');

    await realFetch(3);
    expect(apiRequest).toHaveBeenLastCalledWith('/foster-applications?page=3');
  });
});
