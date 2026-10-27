import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { VolunteerScreen } from '@/screens/volunteer';
import { useAuth } from '@/hooks/useAuth';
import {
  useCreateVolunteerApplication,
  useMyVolunteerApplication,
} from '@/hooks/useVolunteerApplications';
import { router } from 'expo-router';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/hooks/useVolunteerApplications', () => ({
  useMyVolunteerApplication: jest.fn(),
  useCreateVolunteerApplication: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
}));

const mockedUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockedUseMyVolunteerApplication =
  useMyVolunteerApplication as jest.MockedFunction<
    typeof useMyVolunteerApplication
  >;
const mockedUseCreateVolunteerApplication =
  useCreateVolunteerApplication as jest.MockedFunction<
    typeof useCreateVolunteerApplication
  >;

describe('VolunteerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        username: 'João Silva',
        email: 'joao@example.com',
        role: 'adopter',
        rules: [],
        createdAt: '2026-10-26T00:00:00.000Z',
      },
      isLogged: true,
      isReady: true,
      hasAdopterProfile: true,
      isCheckingProfile: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      handleGoogleLogin: jest.fn(),
      checkAdopterProfile: jest.fn(),
      setHasAdopterProfile: jest.fn(),
      updateUserData: jest.fn(),
    });
    mockedUseCreateVolunteerApplication.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({}),
      isPending: false,
    } as unknown as ReturnType<typeof useCreateVolunteerApplication>);
  });

  it('renders the volunteer signup form when user has no application', async () => {
    mockedUseMyVolunteerApplication.mockReturnValue({
      data: null,
      isLoading: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useMyVolunteerApplication>);

    const { getByText, getByDisplayValue } = await render(<VolunteerScreen />);

    expect(getByText('Seja Voluntário na Kapa')).toBeTruthy();
    expect(getByDisplayValue('João Silva')).toBeTruthy();
    expect(getByText('Cuidados com os pets')).toBeTruthy();
    expect(getByText('Limpeza e organização')).toBeTruthy();
    expect(getByText('Enviar inscrição de voluntariado')).toBeTruthy();
  });

  it('renders pending status card when user has a pending application', async () => {
    mockedUseMyVolunteerApplication.mockReturnValue({
      data: {
        id: 'app-1',
        userId: 'user-1',
        status: 'pending',
        appliedAt: '2026-10-26T12:00:00.000Z',
        application: {
          fullName: 'João Silva',
          phone: '(19) 99999-8888',
          areasOfInterest: ['care', 'event'],
          availability: 'weekends',
          motivation: 'Quero ajudar nos finais de semana.',
          acceptsTerms: true,
        },
      },
      isLoading: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useMyVolunteerApplication>);

    const { getByText } = await render(<VolunteerScreen />);

    expect(getByText('Solicitação em análise')).toBeTruthy();
    expect(getByText('Pendente')).toBeTruthy();
    expect(getByText('Finais de semana')).toBeTruthy();
  });

  it('renders approved volunteer card and navigates to activities when user is a volunteer', async () => {
    mockedUseAuth.mockReturnValue({
      user: {
        id: 'user-1',
        username: 'João Silva',
        email: 'joao@example.com',
        role: 'volunteer',
        rules: [],
        createdAt: '2026-10-26T00:00:00.000Z',
      },
      isLogged: true,
      isReady: true,
      hasAdopterProfile: true,
      isCheckingProfile: false,
      signIn: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      handleGoogleLogin: jest.fn(),
      checkAdopterProfile: jest.fn(),
      setHasAdopterProfile: jest.fn(),
      updateUserData: jest.fn(),
    });
    mockedUseMyVolunteerApplication.mockReturnValue({
      data: null,
      isLoading: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useMyVolunteerApplication>);

    const { getByText, getByLabelText } = await render(<VolunteerScreen />);

    expect(
      getByText('Você faz parte do time de voluntários!'),
    ).toBeTruthy();

    fireEvent.press(
      getByLabelText('Ver atividades disponíveis para voluntários'),
    );
    expect(router.push).toHaveBeenCalledWith('/(protected)/(tabs)/activities');
  });

  it('submits the volunteer form when valid data is provided', async () => {
    const mutateAsync = jest.fn().mockResolvedValue({});
    mockedUseMyVolunteerApplication.mockReturnValue({
      data: null,
      isLoading: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useMyVolunteerApplication>);
    mockedUseCreateVolunteerApplication.mockReturnValue({
      mutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useCreateVolunteerApplication>);

    const { getByPlaceholderText, getByLabelText, getByText } = await render(
      <VolunteerScreen />,
    );

    fireEvent.changeText(
      getByPlaceholderText('(19) 99999-9999'),
      '(19) 98888-7777',
    );
    fireEvent.press(getByLabelText('Cuidados com os pets'));
    fireEvent.press(getByLabelText('Finais de semana'));
    fireEvent.changeText(
      getByPlaceholderText(
        'Conte se já teve contato com animais ou como pretende apoiar o abrigo',
      ),
      'Tenho experiência cuidando de cães e quero apoiar aos sábados.',
    );
    fireEvent.press(
      getByText(
        'Comprometo-me a respeitar as orientações de segurança e bem-estar animal da ONG Kapa Protetores.',
      ),
    );
    fireEvent.press(getByText('Enviar inscrição de voluntariado'));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        fullName: 'João Silva',
        phone: '(19) 98888-7777',
        areasOfInterest: ['care'],
        availability: 'weekends',
        motivation:
          'Tenho experiência cuidando de cães e quero apoiar aos sábados.',
        acceptsTerms: true,
      });
    });
  });
});
