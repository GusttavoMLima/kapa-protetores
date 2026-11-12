import { fireEvent, render } from '@testing-library/react-native';
import type { Adoption, UpdateAdoptionStatusInput } from '@kapa/shared';
import { MutationObserver, QueryClient, QueryObserver } from '@tanstack/react-query';
import { AdoptionRequestsScreen } from '@/screens/adoptionRequests';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAdoptions, useUpdateAdoptionStatus } from '@/hooks/useAdoptions';
import { openAdoptionContract } from '@/utils/adoptionContract';

jest.mock('expo-router', () => ({ Redirect: () => null, router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() } }));
jest.mock('@/hooks/useAuth', () => ({ useAuth: jest.fn() }));
jest.mock('@/components/header/default', () => ({ DefaultHeader: () => null }));
jest.mock('@/hooks/useAdoptions', () => ({ useAdminAdoptions: jest.fn(), useUpdateAdoptionStatus: jest.fn(), useUploadSignedContract: () => ({ mutate: jest.fn(), isPending: false }) }));
jest.mock('@/utils/adoptionContract', () => ({ openAdoptionContract: jest.fn(() => true), buildContractWhatsAppUrl: jest.fn(() => 'https://wa.me/5519999998888'), selectSignedContractPdf: jest.fn() }));

const useRequests = jest.mocked(useAdminAdoptions);
const useSession = jest.mocked(useAuth);
const mutate = jest.fn();
const refetch = jest.fn();
const request: Adoption = {
  id: 'request-1', adopterId: 'user-1', animalId: 'pet-1', status: 'pending', appliedAt: '2026-11-10T15:00:00Z', updatedAt: '2026-11-10T15:00:00Z',
  application: { fullName: 'Ana Souza', birthDate: '1990-01-01', phone: '19999998888', street: 'Rua das Flores', number: '20', neighborhood: 'Centro', city: 'Mogi Guaçu', postalCode: '13840000', housingType: 'house', housingSituation: 'own', residenceProtection: 'yes', hasChildren: 'no', hasOtherPets: 'no', residentsAgree: 'yes', freeStreetAccess: 'no', awareOfResponsibilities: 'yes' },
};

function data(requests: Adoption[], extra = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  client.setQueryData(['fixture'], requests);
  const result = new QueryObserver<Adoption[]>(client, { queryKey: ['fixture'], enabled: false }).getCurrentResult();
  useRequests.mockReturnValue(Object.assign(result, { refetch }, extra));
}

describe('AdoptionRequestsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useSession.mockReturnValue({ user: { role: 'admin' } } as ReturnType<typeof useAuth>);
    const result = new MutationObserver<Adoption, Error, { id: string } & UpdateAdoptionStatusInput>(new QueryClient(), { mutationFn: async () => request }).getCurrentResult();
    jest.mocked(useUpdateAdoptionStatus).mockReturnValue({ ...result, mutate, mutateAsync: async () => request });
    data([request]);
  });
  it('não consulta fichas para outros perfis', async () => {
    useSession.mockReturnValue({ user: { role: 'adopter' } } as ReturnType<typeof useAuth>);
    await render(<AdoptionRequestsScreen />);
    expect(useRequests).not.toHaveBeenCalled();
  });
  it('mostra o resumo e revela dados pessoais somente ao expandir', async () => {
    const screen = await render(<AdoptionRequestsScreen />);
    expect(screen.getByText('Ana Souza')).toBeTruthy();
    expect(screen.queryByText('Rua das Flores, 20 · Centro')).toBeNull();
    await fireEvent.press(screen.getByLabelText('Analisar ficha de Ana Souza'));
    expect(screen.getByText('Rua das Flores, 20 · Centro')).toBeTruthy();
    expect(screen.getByText('Compromissos com o cuidado')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Recolher ficha de Ana Souza'));
    expect(screen.queryByText('Rua das Flores, 20 · Centro')).toBeNull();
  });
  it('busca sem acentos, filtra etapas e oferece limpar filtros', async () => {
    data([request, { ...request, id: 'request-2', status: 'canceled', application: { ...request.application!, fullName: 'João Lima' } }]);
    const screen = await render(<AdoptionRequestsScreen />);
    await fireEvent.changeText(screen.getByLabelText('Buscar por família, pet ou cidade'), 'joao');
    expect(screen.queryByText('Ana Souza')).toBeNull();
    expect(screen.getByText('João Lima')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Filtrar Em análise'));
    expect(screen.getByText('Nenhuma ficha com esses filtros')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Limpar filtros'));
    expect(screen.getByText('Ana Souza')).toBeTruthy();
  });
  it('exige confirmação para recusar e permite desistir', async () => {
    const screen = await render(<AdoptionRequestsScreen />);
    await fireEvent.press(screen.getByLabelText('Analisar ficha de Ana Souza'));
    await fireEvent.press(screen.getByLabelText('Recusar ficha'));
    expect(mutate).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByLabelText('Voltar à análise'));
    expect(mutate).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByLabelText('Recusar ficha'));
    await fireEvent.press(screen.getByLabelText('Confirmar recusa'));
    expect(mutate).toHaveBeenCalledWith({ id: request.id, status: 'rejected' }, expect.any(Object));
  });
  it('pré-aprova e salva somente os dados da ficha selecionada', async () => {
    const screen = await render(<AdoptionRequestsScreen />);
    await fireEvent.press(screen.getByLabelText('Analisar ficha de Ana Souza'));
    await fireEvent.changeText(screen.getByLabelText('Anotação interna da solicitação de Ana Souza'), '  Conversar sábado  ');
    await fireEvent.press(screen.getByLabelText('Salvar anotação'));
    expect(mutate).toHaveBeenCalledWith({ id: request.id, adminNote: 'Conversar sábado' }, expect.any(Object));
    await fireEvent.press(screen.getByLabelText('Pré-aprovar e iniciar contato'));
    expect(mutate).toHaveBeenCalledWith({ id: request.id, status: 'interviewing' }, expect.any(Object));
  });
  it('mantém a conclusão bloqueada sem assinatura e preserva visualização do contrato', async () => {
    data([{ ...request, status: 'interviewing' }]);
    const screen = await render(<AdoptionRequestsScreen />);
    await fireEvent.press(screen.getByLabelText('Analisar ficha de Ana Souza'));
    await fireEvent.press(screen.getByLabelText('Concluir adoção'));
    expect(mutate).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByLabelText('Visualizar contrato'));
    expect(openAdoptionContract).toHaveBeenCalledWith(expect.objectContaining({ id: request.id }), false);
  });
  it.each(['success', 'error'])('mostra retorno de %s ao salvar uma alteração', async (kind) => {
    mutate.mockImplementationOnce((_input: unknown, callbacks: { onSuccess: () => void; onError: () => void }) => kind === 'success' ? callbacks.onSuccess() : callbacks.onError());
    const screen = await render(<AdoptionRequestsScreen />);
    await fireEvent.press(screen.getByLabelText('Analisar ficha de Ana Souza'));
    await fireEvent.press(screen.getByLabelText('Pré-aprovar e iniciar contato'));
    expect(screen.getByText(kind === 'success' ? 'Ficha pré-aprovada. Você já pode conversar com a família.' : 'Não foi possível salvar a alteração. Tente novamente.')).toBeTruthy();
  });
  it('pede confirmação para concluir após receber o contrato assinado', async () => {
    data([{ ...request, status: 'interviewing', signedContractUploadedAt: request.appliedAt }]);
    const screen = await render(<AdoptionRequestsScreen />);
    await fireEvent.press(screen.getByLabelText('Analisar ficha de Ana Souza'));
    await fireEvent.press(screen.getByLabelText('Concluir adoção'));
    expect(mutate).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByLabelText('Confirmar adoção'));
    expect(mutate).toHaveBeenCalledWith({ id: request.id, status: 'approved' }, expect.any(Object));
  });
  it('mostra fichas sem dados em vez de ocultar o registro', async () => {
    data([{ ...request, application: undefined }]);
    const screen = await render(<AdoptionRequestsScreen />);
    await fireEvent.press(screen.getByLabelText('Analisar ficha de Família interessada'));
    expect(screen.getByText(/Os dados desta ficha não estão disponíveis/)).toBeTruthy();
    expect(screen.queryByLabelText('Recusar ficha')).toBeNull();
  });
  it('oferece estados de carregamento, vazio e falha com nova tentativa', async () => {
    data([], { isLoading: true });
    const screen = await render(<AdoptionRequestsScreen />);
    expect(screen.getByText('Carregando solicitações…')).toBeTruthy();
    data([]);
    await screen.rerender(<AdoptionRequestsScreen />);
    expect(screen.getByText('O próximo novo lar começa aqui')).toBeTruthy();
    data([], { error: new Error('fixture') });
    await screen.rerender(<AdoptionRequestsScreen />);
    await fireEvent.press(screen.getByLabelText('Tentar novamente'));
    expect(refetch).toHaveBeenCalledTimes(1);
  });
});
