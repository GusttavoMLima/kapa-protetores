import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SystemEventTypes } from '@kapa/shared';
import { MyEventsScreen } from '../../src/screens/myEvents';
import { useUserEvents } from '@/hooks/useUserEvents';

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
}));

jest.mock('@/hooks/useUserEvents', () => ({
  useUserEvents: jest.fn(),
}));

const mockedUseUserEvents = useUserEvents as jest.MockedFunction<
  typeof useUserEvents
>;

describe('MyEventsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user events list and pagination controls', async () => {
    mockedUseUserEvents.mockReturnValue({
      data: {
        items: [
          {
            id: 'evt-1',
            type: SystemEventTypes.PET_FAVORITED,
            userId: '123e4567-e89b-12d3-a456-426614174000',
            animalId: 'cjld2cjxh0000qzrmn831i7rn',
            payload: { animalName: 'Thor' },
            emittedAt: '2026-10-24T14:00:00.000Z',
          },
          {
            id: 'evt-2',
            type: SystemEventTypes.VOLUNTEER_REGISTERED,
            userId: '123e4567-e89b-12d3-a456-426614174000',
            animalId: null,
            payload: {
              communityEventId: 'comm-1',
              eventTitle: 'Feira de Adoção',
            },
            emittedAt: '2026-10-24T15:00:00.000Z',
          },
        ],
        total: 12,
        page: 1,
        limit: 10,
        totalPages: 2,
      },
      isLoading: false,
      isRefetching: false,
      error: null,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useUserEvents>);

    await render(<MyEventsScreen />);

    expect(screen.getByText('Minhas atividades')).toBeTruthy();
    expect(screen.getByText('Pet favoritado')).toBeTruthy();
    expect(
      screen.getByText('Thor foi adicionado aos seus favoritos.'),
    ).toBeTruthy();
    expect(
      screen.getByText('Inscrição em atividade voluntária'),
    ).toBeTruthy();
    expect(
      screen.getByText('Página 1 de 2 (12 registros)'),
    ).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Próxima página'));
    expect(mockedUseUserEvents).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2, limit: 10 }),
    );
  });

  it('filters events when selecting a filter chip', async () => {
    mockedUseUserEvents.mockReturnValue({
      data: {
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
      isLoading: false,
      isRefetching: false,
      error: null,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useUserEvents>);

    await render(<MyEventsScreen />);

    await fireEvent.press(screen.getByLabelText('Filtrar por Voluntariado'));
    expect(mockedUseUserEvents).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: 1,
        type: SystemEventTypes.VOLUNTEER_REGISTERED,
      }),
    );
  });
});
