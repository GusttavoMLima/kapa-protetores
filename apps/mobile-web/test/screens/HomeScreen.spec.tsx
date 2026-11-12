import { Platform } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import type { Animal } from '@kapa/shared';
import { router } from 'expo-router';
import { useAdoptAnimals } from '@/hooks/useAdoptAnimals';
import { useAuth } from '@/hooks/useAuth';
import { HomeScreen } from '@/screens/home';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

jest.mock('@/hooks/useAdoptAnimals', () => ({
  useAdoptAnimals: jest.fn(),
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    data: { favorites: [], counts: { favorites: 0, adoptions: 0, events: 0 } },
  }),
}));

jest.mock('@/hooks/useFavorites', () => ({
  useToggleFavorite: () => ({ mutate: jest.fn() }),
}));

const mockedUseAdoptAnimals = jest.mocked(useAdoptAnimals);
const mockedUseAuth = jest.mocked(useAuth);

const availableAnimal: Animal = {
  id: 'pet-1',
  name: 'Billy',
  breed: 'Sem raça definida',
  species: 'dog',
  gender: 'male',
  weightKg: 18,
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
  mood: 'Tranquilo',
  observations: 'Billy espera uma família.',
  status: 'available',
  createdAt: '2026-10-01T00:00:00.000Z',
  photos: [],
};

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      user: { role: 'adopter' },
    } as ReturnType<typeof useAuth>);
  });

  it('separa a gestão do admin e abre cada card sem carregar o catálogo', async () => {
    mockedUseAuth.mockReturnValue({ user: { role: 'admin', username: 'Equipe' } } as ReturnType<typeof useAuth>);
    const screen = await render(<HomeScreen />);
    expect(screen.queryByText('Adotar Agora')).toBeNull();
    expect(screen.queryByText('Ser Voluntario')).toBeNull();
    expect(mockedUseAdoptAnimals).not.toHaveBeenCalled();
    for (const title of ['Solicitações de adoção', 'Animais do abrigo', 'Organizar atividades', 'Candidaturas de voluntários']) {
      await fireEvent.press(screen.getByText(title));
    }
    expect(router.push).toHaveBeenCalledTimes(4);
    expect(screen.getByLabelText('Cadastrar usuário da equipe')).toBeTruthy();
  });

  it('mostra animais disponíveis cadastrados', async () => {
    mockedUseAdoptAnimals.mockReturnValue({
      data: [availableAnimal, { ...availableAnimal, id: 'pet-2', status: 'adopted' }],
      isLoading: false,
    } as ReturnType<typeof useAdoptAnimals>);

    const { getByText } = await render(<HomeScreen />);

    expect(getByText('Billy')).toBeTruthy();
    expect(getByText('2 anos • Macho')).toBeTruthy();
    expect(getByText('Ver todos os 1 pet')).toBeTruthy();
  });

  it('abre os detalhes ao tocar em um pet', async () => {
    mockedUseAdoptAnimals.mockReturnValue({
      data: [availableAnimal],
      isLoading: false,
    } as ReturnType<typeof useAdoptAnimals>);

    const { getByText } = await render(<HomeScreen />);

    fireEvent.press(getByText('Billy'));

    expect(router.push).toHaveBeenCalledWith({
      pathname: '/adopet/[id]',
      params: { id: 'pet-1' },
    });
  });

  it('oculta o atalho de gestão de animais para voluntários e exibe para admin e protetor', async () => {
    mockedUseAdoptAnimals.mockReturnValue({
      data: [availableAnimal],
      isLoading: false,
    } as ReturnType<typeof useAdoptAnimals>);

    mockedUseAuth.mockReturnValue({
      user: { role: 'volunteer' },
    } as ReturnType<typeof useAuth>);

    const volunteerRender = await render(<HomeScreen />);
    expect(volunteerRender.queryByText('Animais do abrigo')).toBeNull();

    for (const role of ['admin', 'protector'] as const) {
      mockedUseAuth.mockReturnValue({
        user: { role },
      } as ReturnType<typeof useAuth>);
      const staffRender = await render(<HomeScreen />);
      expect(staffRender.getByText('Animais do abrigo')).toBeTruthy();
    }
  });

  describe('cartões de gestão por plataforma', () => {
    const originalOS = Platform.OS;

    afterEach(() => {
      Platform.OS = originalOS;
    });

    function renderAsAdmin() {
      mockedUseAdoptAnimals.mockReturnValue({
        data: [availableAnimal],
        isLoading: false,
      } as ReturnType<typeof useAdoptAnimals>);
      mockedUseAuth.mockReturnValue({
        user: { role: 'admin' },
      } as ReturnType<typeof useAuth>);

      return render(<HomeScreen />);
    }

    it('no web mostra todos os cartões em linhas que quebram, sem rolagem horizontal', async () => {
      Platform.OS = 'web';

      const { getByTestId, queryByTestId, getByText } = await renderAsAdmin();

      expect(getByTestId('home-card-grid').props.className).toContain('flex-wrap');
      expect(queryByTestId('home-card-carousel')).toBeNull();
      expect(getByText('Usuários')).toBeTruthy();
    });

    it('no mobile mantém o carrossel horizontal', async () => {
      Platform.OS = 'ios';

      const { getByTestId, queryByTestId, getByText } = await renderAsAdmin();

      expect(queryByTestId('home-card-grid')).toBeNull();
      expect(getByTestId('home-card-carousel')).toBeTruthy();
      expect(getByText('Usuários')).toBeTruthy();
    });
  });

  it('filtra animais em destaque por espécie (cães e gatos)', async () => {
    const availableCat: Animal = {
      ...availableAnimal,
      id: 'pet-cat-1',
      name: 'Mimi',
      species: 'cat',
      gender: 'female',
      age: 1,
    };

    mockedUseAdoptAnimals.mockReturnValue({
      data: [availableAnimal, availableCat],
      isLoading: false,
    } as ReturnType<typeof useAdoptAnimals>);

    const { getByText, queryByText } = await render(<HomeScreen />);

    expect(getByText('Billy')).toBeTruthy();
    expect(getByText('Mimi')).toBeTruthy();

    await fireEvent.press(getByText('Gatos (1)'));
    expect(queryByText('Billy')).toBeNull();
    expect(getByText('Mimi')).toBeTruthy();

    await fireEvent.press(getByText('Cães (1)'));
    expect(getByText('Billy')).toBeTruthy();
    expect(queryByText('Mimi')).toBeNull();

    await fireEvent.press(getByText('Todos (2)'));
    expect(getByText('Billy')).toBeTruthy();
    expect(getByText('Mimi')).toBeTruthy();
  });
});
