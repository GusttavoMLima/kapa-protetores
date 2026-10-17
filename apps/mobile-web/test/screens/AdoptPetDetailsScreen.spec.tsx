import { fireEvent, render } from '@testing-library/react-native';
import type { Animal } from '@kapa/shared';
import { router } from 'expo-router';
import { AdoptPetDetailsScreen } from '@/screens/adopt/details';
import { useAdoptAnimals } from '@/hooks/useAdoptAnimals';

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
    push: jest.fn(),
    replace: jest.fn(),
  },
  useLocalSearchParams: () => ({ id: 'pet-1' }),
}));

jest.mock('@/hooks/useAdoptAnimals', () => ({
  useAdoptAnimals: jest.fn(),
}));


const mockedUseAdoptAnimals = jest.mocked(useAdoptAnimals);

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

describe('AdoptPetDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAdoptAnimals.mockReturnValue({
      data: [animal],
      isLoading: false,
      error: null,
    } as ReturnType<typeof useAdoptAnimals>);
  });

  it('mostra as informações do pet disponível', async () => {
    const { getByText, getByLabelText } = await render(<AdoptPetDetailsScreen />);

    expect(getByText('Luna')).toBeTruthy();
    expect(getByText('Luna adora passeios tranquilos.')).toBeTruthy();
    expect(getByLabelText('Preencher ficha para Luna')).toBeTruthy();
  });

  it('abre a ficha de adoção do pet', async () => {
    const { getByLabelText } = await render(<AdoptPetDetailsScreen />);

    fireEvent.press(getByLabelText('Preencher ficha para Luna'));

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
