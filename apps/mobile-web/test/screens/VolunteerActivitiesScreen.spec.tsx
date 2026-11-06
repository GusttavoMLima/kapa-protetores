import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { VolunteerActivitiesScreen } from '@/screens/volunteerActivities';
import { useAuth } from '@/hooks/useAuth';
import { kapaService } from '@/services/kapaService';

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/services/kapaService', () => ({
  kapaService: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

const mockedUseAuth = jest.mocked(useAuth);
const mockedKapaService = jest.mocked(kapaService);

const sampleActivity = {
  id: 'c000000000000000000000001',
  title: 'Mutirão de Banho e Escovação',
  description: 'Apoio aos cães do abrigo durante a manhã de sábado.',
  cep: 13600000,
  type: 'care' as const,
  startAt: '2027-05-10T12:00:00.000Z',
  endAt: '2027-05-10T16:00:00.000Z',
  location: 'Sede Kapa',
  vacancies: 10,
  createdAt: '2026-11-01T10:00:00.000Z',
  isSignedUp: false,
  volunteerCount: 3,
  remainingVacancies: 7,
};

describe('VolunteerActivitiesScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAuth.mockReturnValue({
      user: {
        id: 'vol-1',
        username: 'Ana Voluntária',
        email: 'ana@example.com',
        role: 'volunteer',
        rules: [],
        createdAt: '2026-10-01T00:00:00.000Z',
      },
    } as unknown as ReturnType<typeof useAuth>);
  });

  it('permite inscrever-se e cancelar inscrição em uma atividade voluntária', async () => {
    mockedKapaService.get.mockResolvedValueOnce({
      data: {
        success: true,
        data: [sampleActivity],
      },
    } as never);

    mockedKapaService.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          ...sampleActivity,
          isSignedUp: true,
          volunteerCount: 4,
          remainingVacancies: 6,
        },
      },
    } as never);

    mockedKapaService.delete.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          ...sampleActivity,
          isSignedUp: false,
          volunteerCount: 3,
          remainingVacancies: 7,
        },
      },
    } as never);

    const { getByText, getByLabelText } = await render(
      <VolunteerActivitiesScreen />,
    );

    await waitFor(() => {
      expect(getByText('Mutirão de Banho e Escovação')).toBeTruthy();
    });

    await fireEvent.press(
      getByLabelText('Inscrever-se em Mutirão de Banho e Escovação'),
    );

    await waitFor(() => {
      expect(mockedKapaService.post).toHaveBeenCalledWith(
        '/community-events/c000000000000000000000001/volunteers',
      );
      expect(getByText('Cancelar inscrição')).toBeTruthy();
    });

    await fireEvent.press(
      getByLabelText('Cancelar inscrição em Mutirão de Banho e Escovação'),
    );

    await waitFor(() => {
      expect(mockedKapaService.delete).toHaveBeenCalledWith(
        '/community-events/c000000000000000000000001/volunteers',
      );
      expect(getByText('Quero participar')).toBeTruthy();
    });
  });
});
