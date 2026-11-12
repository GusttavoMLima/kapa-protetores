import { fireEvent, render, within } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from 'expo-router';
import { FosterCareScreen } from '@/screens/fosterCare';
import { FosterApplicationsScreen } from '@/screens/fosterCare/FosterApplicationsScreen';
import { fosterHomeQuestions } from '@/screens/fosterCare/FosterHomeDetails';
import { SupportScreen } from '@/screens/support';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/services/api';
import {
  fetchFosterApplications,
  fetchMyFosterApplication,
  reviewFosterApplication,
  submitFosterApplication,
} from '@/services/fosterApplications';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), canGoBack: jest.fn(), push: jest.fn(), replace: jest.fn() },
}));
jest.mock('@/hooks/useAuth');
jest.mock('@/services/fosterApplications', () => ({
  fosterStatusLabel: { pending: 'Em análise', approved: 'Aprovada' },
  fetchFosterApplications: jest.fn(),
  fetchMyFosterApplication: jest.fn(),
  reviewFosterApplication: jest.fn(),
  submitFosterApplication: jest.fn(),
}));

describe('Lar Temporário', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAuth).mockReturnValue({ user: null } as ReturnType<typeof useAuth>);
  });
  afterEach(() => jest.restoreAllMocks());

  it('opens the screen from the support card', async () => {
    const screen = await render(<SupportScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Abrir tela de Lar Temporário' }));
    expect(router.push).toHaveBeenCalledWith('/lar-temporario');
  });

  it('explains how to foster and returns to support on a direct visit', async () => {
    jest.mocked(router.canGoBack).mockReturnValue(false);
    const screen = await render(<FosterCareScreen />);
    expect(screen.getByRole('header', { name: 'Lar Temporário' })).toBeTruthy();
    expect(screen.getByText(/Você acolhe um animal em recuperação/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Voltar para Apoie a Kapa' }));
    expect(router.replace).toHaveBeenCalledWith('/support');
  });

  it('submits the application and displays the persisted status', async () => {
    jest.mocked(useAuth).mockReturnValue({
      user: { id: 'applicant', role: 'adopter' },
    } as ReturnType<typeof useAuth>);
    const details = {
      availability: 'A partir de sábado', homeNotes: 'Quarto separado',
      homeAddress: 'Rua de Teste, 123 • Centro, Mogi Guaçu • CEP 13840-001',
      hasOtherAnimals: false, hasPerimeterBarrier: true, hasSecureGate: true,
    };
    const now = new Date().toISOString();
    jest.mocked(fetchMyFosterApplication).mockResolvedValue(null);
    const lookup = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ logradouro: 'Rua de Teste', bairro: 'Centro', localidade: 'Mogi Guaçu' }),
    } as Response);
    jest.mocked(submitFosterApplication).mockResolvedValue({
      ...details, id: 'c000000000000000000000001', status: 'pending', submittedAt: now, updatedAt: now,
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
    const screen = await render(
      <QueryClientProvider client={client}>
        <FosterCareScreen />
      </QueryClientProvider>,
    );
    await fireEvent.changeText(await screen.findByLabelText('Disponibilidade'), details.availability);
    await fireEvent.changeText(screen.getByLabelText('Espaço de acolhimento'), details.homeNotes);
    const submit = screen.getByRole('button', { name: 'Enviar candidatura' });
    await fireEvent.press(within(screen.getByLabelText(fosterHomeQuestions.hasOtherAnimals)).getByRole('radio', { name: 'Não' }));
    await fireEvent.press(within(screen.getByLabelText(fosterHomeQuestions.hasPerimeterBarrier)).getByRole('radio', { name: 'Sim' }));
    expect(submit).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText('CEP'), '13840001');
    expect(await screen.findByDisplayValue('Rua de Teste')).toBeTruthy();
    expect(lookup).toHaveBeenCalledWith('https://viacep.com.br/ws/13840001/json/', expect.objectContaining({ signal: expect.anything() }));
    await fireEvent.changeText(screen.getByLabelText('Número'), '123');
    expect(submit).toBeDisabled();
    await fireEvent.press(within(screen.getByLabelText(fosterHomeQuestions.hasSecureGate)).getByRole('radio', { name: 'Sim' }));
    await fireEvent.press(submit);
    expect(await screen.findByText('Em análise')).toBeTruthy();
    expect(screen.getByText(details.homeAddress)).toBeTruthy();
    expect(jest.mocked(submitFosterApplication).mock.calls[0]?.[0]).toEqual(details);
    expect(screen.queryByRole('button', { name: 'Enviar candidatura' })).toBeNull();
  });

  it('offers sign-in instead of retrying a rejected session', async () => {
    const signOut = jest.fn();
    jest.mocked(useAuth).mockReturnValue({
      isLogged: true,
      isReady: true,
      hasAdopterProfile: true,
      isCheckingProfile: false,
      checkAdopterProfile: jest.fn(),
      setHasAdopterProfile: jest.fn(),
      signIn: jest.fn(),
      signUp: jest.fn(),
      handleGoogleLogin: jest.fn(),
      updateUserData: jest.fn(),
      user: {
        id: 'applicant', role: 'adopter', username: 'Maria', email: 'maria@example.org',
        rules: [], createdAt: '2026-11-11T00:00:00.000Z',
      },
      signOut,
    });
    jest.mocked(fetchMyFosterApplication).mockRejectedValue(new ApiError('Não autorizado', 401));
    const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
    const screen = await render(
      <QueryClientProvider client={client}>
        <FosterCareScreen />
      </QueryClientProvider>,
    );
    await fireEvent.press(await screen.findByRole('button', { name: 'Entrar novamente' }));
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(fetchMyFosterApplication).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Enviar candidatura' })).toBeNull();
  });

  it('asks for confirmation before approving an application', async () => {
    jest.mocked(useAuth).mockReturnValue({
      user: { id: 'staff', role: 'protector' },
    } as ReturnType<typeof useAuth>);
    const now = new Date().toISOString();
    const item = {
      id: 'c000000000000000000000001', availability: 'Fim de semana', homeNotes: 'Quarto separado',
      homeAddress: null, hasOtherAnimals: null, hasPerimeterBarrier: null, hasSecureGate: null,
      submittedAt: now, updatedAt: now, applicant: { username: 'Maria', email: 'maria@example.org' },
    };
    jest.mocked(fetchFosterApplications)
      .mockResolvedValueOnce({ items: [{ ...item, status: 'pending' }], pageSize: 20, total: 1 })
      .mockResolvedValueOnce({ items: [{ ...item, status: 'approved' }], pageSize: 20, total: 1 });
    jest.mocked(reviewFosterApplication).mockResolvedValue(undefined);
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { gcTime: Infinity } } });
    const screen = await render(
      <QueryClientProvider client={client}>
        <FosterApplicationsScreen />
      </QueryClientProvider>,
    );
    const approve = await screen.findByRole('button', { name: 'Aprovar candidatura de Maria' });
    expect(screen.getAllByText('Não informado')).toHaveLength(4);
    await fireEvent.press(approve);
    expect(reviewFosterApplication).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Confirmar decisão' }));
    expect(await screen.findByText('Aprovada')).toBeTruthy();
    expect(reviewFosterApplication).toHaveBeenCalledWith(item.id, 'approved');
  });
});
