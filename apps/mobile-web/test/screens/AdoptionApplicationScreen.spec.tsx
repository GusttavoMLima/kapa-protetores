import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { Animal } from '@kapa/shared';
import { AdoptionApplicationScreen } from '@/screens/adopt/application';
import { useAdoptAnimals } from '@/hooks/useAdoptAnimals';
import { useAuth } from '@/hooks/useAuth';

const mockRouter = {
  back: jest.fn(),
  replace: jest.fn(),
};

jest.mock('expo-router', () => ({
  router: mockRouter,
  useLocalSearchParams: () => ({ id: 'pet-1' }),
}));

jest.mock('@/hooks/useAdoptAnimals', () => ({
  useAdoptAnimals: jest.fn(),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

const mockedUseAdoptAnimals = jest.mocked(useAdoptAnimals);
const mockedUseAuth = jest.mocked(useAuth);

const animal: Animal = {
  id: 'pet-1',
  name: 'Luna',
  breed: 'Vira-lata',
  species: 'dog',
  gender: 'female',
  weightKg: 12,
  age: 2,
  ageStage: 2,
  size: 3,
  energyLevel: 3,
  kidFriendly: 4,
  noiseLevel: 2,
  apartmentFriendly: true,
  otherPetFriendly: true,
  healthCondition: 'healthy',
  castrated: 'yes',
  vaccinated: true,
  dewormed: 'yes',
  rescuedAt: '2026-10-01T00:00:00.000Z',
  place: 'Abrigo Kapa',
  mood: 'Carinhosa e brincalhona',
  observations: 'Luna adora passeios tranquilos.',
  status: 'available',
  createdAt: '2026-10-01T00:00:00.000Z',
  photos: [],
};

describe('AdoptionApplicationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = jest.fn();
    mockedUseAdoptAnimals.mockReturnValue({
      data: [animal],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useAdoptAnimals>);
    mockedUseAuth.mockReturnValue({
      user: { username: 'Ana Souza', email: 'ana@example.com' },
    } as ReturnType<typeof useAuth>);
  });

  it('mostra a ficha para o pet selecionado', async () => {
    const { getByText, getByDisplayValue } = await render(<AdoptionApplicationScreen />);

    expect(getByText('Ficha de adoção')).toBeTruthy();
    expect(getByText('Você está se candidatando para')).toBeTruthy();
    expect(getByText('Luna')).toBeTruthy();
    expect(getByDisplayValue('Ana Souza')).toBeTruthy();
    expect(getByText('Telefone / WhatsApp com DDD')).toBeTruthy();
    expect(getByText('Endereço')).toBeTruthy();
  });

  it('mostra mensagens quando a ficha está incompleta', async () => {
    const { getByText } = await render(<AdoptionApplicationScreen />);

    fireEvent.press(getByText('Concluir ficha'));

    await waitFor(() => {
      expect(getByText('Informe um telefone com DDD.')).toBeTruthy();
      expect(getByText('Informe a cidade.')).toBeTruthy();
      expect(getByText('Selecione onde você mora.')).toBeTruthy();
    });
  });

  it('preenche parte do endereço ao consultar um CEP', async () => {
    jest.mocked(globalThis.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({
        logradouro: 'Praça da Sé',
        bairro: 'Sé',
        localidade: 'São Paulo',
      }),
    } as Response);
    const { getByLabelText, getByDisplayValue } = await render(<AdoptionApplicationScreen />);

    fireEvent.changeText(getByLabelText('CEP'), '01001000');

    await waitFor(() => {
      expect(getByDisplayValue('Praça da Sé')).toBeTruthy();
      expect(getByDisplayValue('Sé')).toBeTruthy();
      expect(getByDisplayValue('São Paulo')).toBeTruthy();
    });
  });
});
