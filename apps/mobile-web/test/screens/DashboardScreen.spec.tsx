import { fireEvent, render } from '@testing-library/react-native';
import { SystemEventTypes, type ShelterDashboardSummary } from '@kapa/shared';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useShelterDashboard } from '@/hooks/useShelterDashboard';
import { DashboardScreen } from '@/screens/dashboard';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  Redirect: ({ href }: { href: string }) => {
    const { Text } = jest.requireActual('react-native');
    return <Text testID="redirect-target">{href}</Text>;
  },
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/useShelterDashboard', () => ({
  useShelterDashboard: jest.fn(),
}));

const mockedUseAuth = jest.mocked(useAuth);
const mockedUseShelterDashboard = jest.mocked(useShelterDashboard);

const sampleSummary: ShelterDashboardSummary = {
  generatedAt: '2026-11-11T12:00:00.000Z',
  animals: {
    total: 5,
    activeInShelter: 3,
    byStatus: { rescued: 1, treating: 1, available: 1, adopted: 2 },
    bySpecies: { dog: 2, cat: 1, other: 0 },
    activeByCondition: { healthy: 2, injured: 1, debilitated: 0 },
    activeVaccinatedCount: 2,
    activeCastratedCount: 2,
    totalFavoritesCount: 14,
  },
  adoptions: {
    total: 4,
    byStatus: {
      pending: 1,
      interviewing: 1,
      approved: 2,
      rejected: 0,
      canceled: 0,
    },
    approvalRatePercent: 50,
  },
  volunteers: {
    pendingApplicationsCount: 2,
    approvedApplicationsCount: 5,
    rejectedApplicationsCount: 1,
    upcomingEventsCount: 2,
    upcomingVolunteerSignupsCount: 6,
    upcomingTotalVacancies: 10,
  },
  users: {
    totalActive: 10,
    deactivatedCount: 1,
    byRole: { adopter: 6, volunteer: 2, protector: 1, admin: 1 },
  },
  budgetPrediction: {
    totalPredictedBudget: 1305.58,
    activeAnimalsCount: 3,
    averageCostPerAnimal: 435.19,
    byCategory: {
      nutrition: 620.0,
      veterinary: 250.32,
      preventives: 180.0,
      hygiene: 255.26,
    },
    bySpecies: {
      dog: {
        count: 2,
        totalCost: 1085.58,
        averageCost: 542.79,
        breakdown: {
          nutrition: 461.6,
          veterinary: 250.32,
          preventives: 180.0,
          hygiene: 193.66,
        },
      },
      cat: {
        count: 1,
        totalCost: 220.0,
        averageCost: 220.0,
        breakdown: {
          nutrition: 158.4,
          veterinary: 0,
          preventives: 0,
          hygiene: 61.6,
        },
      },
      other: {
        count: 0,
        totalCost: 0,
        averageCost: 0,
        breakdown: {
          nutrition: 0,
          veterinary: 0,
          preventives: 0,
          hygiene: 0,
        },
      },
    },
    bySize: {
      small: {
        count: 1,
        totalCost: 220.0,
        averageCost: 220.0,
        breakdown: {
          nutrition: 158.4,
          veterinary: 0,
          preventives: 0,
          hygiene: 61.6,
        },
      },
      medium: {
        count: 1,
        totalCost: 395.26,
        averageCost: 395.26,
        breakdown: {
          nutrition: 284.59,
          veterinary: 0,
          preventives: 0,
          hygiene: 110.67,
        },
      },
      large: {
        count: 1,
        totalCost: 690.32,
        averageCost: 690.32,
        breakdown: {
          nutrition: 177.01,
          veterinary: 250.32,
          preventives: 180.0,
          hygiene: 82.99,
        },
      },
    },
    byStatus: {
      rescued: {
        count: 1,
        totalCost: 220.0,
        averageCost: 220.0,
        breakdown: {
          nutrition: 158.4,
          veterinary: 0,
          preventives: 0,
          hygiene: 61.6,
        },
      },
      treating: {
        count: 1,
        totalCost: 690.32,
        averageCost: 690.32,
        breakdown: {
          nutrition: 177.01,
          veterinary: 250.32,
          preventives: 180.0,
          hygiene: 82.99,
        },
      },
      available: {
        count: 1,
        totalCost: 395.26,
        averageCost: 395.26,
        breakdown: {
          nutrition: 284.59,
          veterinary: 0,
          preventives: 0,
          hygiene: 110.67,
        },
      },
    },
    animals: [],
  },
  recentEvents: [
    {
      id: 'evt-1',
      type: SystemEventTypes.ADOPTION_REQUESTED,
      emittedAt: '2026-11-11T10:00:00.000Z',
      userName: 'Ana',
      animalName: 'Thor',
    },
  ],
};

describe('DashboardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects non-staff users to home', async () => {
    mockedUseAuth.mockReturnValue({
      user: { role: 'adopter' },
    } as ReturnType<typeof useAuth>);
    mockedUseShelterDashboard.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useShelterDashboard>);

    const { getByTestId } = await render(<DashboardScreen />);
    expect(getByTestId('redirect-target').props.children).toBe(
      '/(protected)/(tabs)/home',
    );
  });

  it('renders KPI cards, ONNX cost breakdown by category and species, and navigates to management routes', async () => {
    mockedUseAuth.mockReturnValue({
      user: { role: 'admin' },
    } as ReturnType<typeof useAuth>);
    mockedUseShelterDashboard.mockReturnValue({
      data: sampleSummary,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useShelterDashboard>);

    const { getByText, getByLabelText } = await render(<DashboardScreen />);

    expect(getByText('Visão geral e indicadores')).toBeTruthy();
    expect(getByText('Detalhamento de Custos Mensais (IA · ONNX)')).toBeTruthy();
    expect(getByText('Alimentação e Dieta')).toBeTruthy();
    expect(getByText('Veterinário e Reabilitação')).toBeTruthy();
    expect(getByText('Vacinas, Vermífugo e Castração')).toBeTruthy();
    expect(getByText('Higiene, Limpeza e Manejo')).toBeTruthy();
    expect(getByText('Cães (2)')).toBeTruthy();
    expect(getByText('Gatos (1)')).toBeTruthy();
    expect(
      getByText('Ana enviou solicitação de adoção para Thor'),
    ).toBeTruthy();

    fireEvent.press(getByLabelText('Gerenciar animais do abrigo'));
    expect(router.push).toHaveBeenCalledWith('/gestao/animais');
  });
});
