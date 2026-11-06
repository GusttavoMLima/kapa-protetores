import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { AdopterProfile, Animal, AnimalPost } from '@kapa/shared';
import { router } from 'expo-router';
import { AdoptPetDetailsScreen } from '@/screens/adopt/details';
import { useAdoptAnimals } from '@/hooks/useAdoptAnimals';
import { useAdopterProfileMe } from '@/hooks/useAdopterProfile';
import { useAnimalPosts, useCreateAnimalPost } from '@/hooks/useAnimalPosts';
import { useAuth } from '@/hooks/useAuth';

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
    push: jest.fn(),
    replace: jest.fn(),
  },
  useLocalSearchParams: () => ({ id: 'pet-1' }),
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('@/hooks/useAdoptAnimals', () => ({
  useAdoptAnimals: jest.fn(),
}));

jest.mock('@/hooks/useAdopterProfile', () => ({
  useAdopterProfileMe: jest.fn(),
}));

jest.mock('@/hooks/useAnimalPosts', () => ({
  useAnimalPosts: jest.fn(),
  useCreateAnimalPost: jest.fn(),
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
const mockedUseAdopterProfileMe = jest.mocked(useAdopterProfileMe);
const mockedUseAnimalPosts = jest.mocked(useAnimalPosts);
const mockedUseCreateAnimalPost = jest.mocked(useCreateAnimalPost);
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

const samplePosts: AnimalPost[] = [
  {
    id: 'post-1',
    animalId: 'pet-1',
    description: 'Luna tomou banho de sol e brincou com a equipe hoje.',
    createdAt: '2026-10-15T10:00:00.000Z',
  },
];

describe('AdoptPetDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAdoptAnimals.mockReturnValue({
      data: [animal],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useAdoptAnimals>);
    mockedUseAdopterProfileMe.mockReturnValue({
      data: {
        id: 'prof-1',
        userId: 'user-1',
        preferredSpecies: 'dog',
        preferredGender: 'female',
        preferredSize: 3,
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      } satisfies AdopterProfile,
    } as unknown as ReturnType<typeof useAdopterProfileMe>);
    mockedUseAnimalPosts.mockReturnValue({
      data: samplePosts,
      isLoading: false,
    } as unknown as ReturnType<typeof useAnimalPosts>);
    mockedUseCreateAnimalPost.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue(samplePosts[0]),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateAnimalPost>);
    mockedUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        username: 'Adotante',
        email: 'adotante@example.com',
        role: 'adopter',
        rules: [],
        createdAt: '2026-10-01T00:00:00.000Z',
      },
    } as unknown as ReturnType<typeof useAuth>);
  });

  it('mostra as informações enriquecidas do pet disponível, compatibilidade e diário', async () => {
    const { getByText, getByLabelText } = await render(
      <AdoptPetDetailsScreen />,
    );

    expect(getByText('Luna')).toBeTruthy();
    expect(getByText('12 kg')).toBeTruthy();
    expect(getByText('100% compatível com seu perfil')).toBeTruthy();
    expect(getByText('Luna adora passeios tranquilos.')).toBeTruthy();
    expect(getByText('Convivência e Perfil')).toBeTruthy();
    expect(getByText('Adapta-se a apartamento')).toBeTruthy();
    expect(getByText('Sociável com outros pets')).toBeTruthy();
    expect(
      getByText('Luna tomou banho de sol e brincou com a equipe hoje.'),
    ).toBeTruthy();
    expect(getByLabelText('Preencher ficha para Luna')).toBeTruthy();
  });

  it('permite que protetores publiquem uma nova atualização no diário do pet', async () => {
    const mutateAsync = jest.fn().mockResolvedValue({});
    mockedUseCreateAnimalPost.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateAnimalPost>);
    mockedUseAuth.mockReturnValue({
      user: {
        id: 'protector-1',
        username: 'Protetor',
        email: 'protetor@example.com',
        role: 'protector',
        rules: [],
        createdAt: '2026-10-01T00:00:00.000Z',
      },
    } as unknown as ReturnType<typeof useAuth>);

    const { getByLabelText } = await render(<AdoptPetDetailsScreen />);

    await fireEvent.changeText(
      getByLabelText('Nova atualização sobre Luna'),
      'Luna recebeu reforço da vacina hoje.',
    );
    await fireEvent.press(
      getByLabelText('Publicar atualização no diário do pet'),
    );

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith(
        'Luna recebeu reforço da vacina hoje.',
      );
    });
  });

  it('abre a ficha de adoção do pet', async () => {
    const { getByLabelText } = await render(<AdoptPetDetailsScreen />);

    await fireEvent.press(getByLabelText('Preencher ficha para Luna'));

    expect(router.push).toHaveBeenCalledWith('/adopet/pet-1/application');
  });

  it('informa quando o pet não está mais disponível', async () => {
    mockedUseAdoptAnimals.mockReturnValue({
      data: [{ ...animal, status: 'adopted' }],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useAdoptAnimals>);

    const { getByText } = await render(<AdoptPetDetailsScreen />);

    expect(getByText('Este pet não está disponível')).toBeTruthy();
  });
});
