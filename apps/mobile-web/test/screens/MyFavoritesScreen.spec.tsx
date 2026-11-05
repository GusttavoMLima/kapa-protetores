import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import { MyFavoritesScreen } from '@/screens/myFavorites';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useToggleFavorite } from '@/hooks/useFavorites';

jest.mock('expo-router', () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
}));

jest.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: jest.fn(),
}));

jest.mock('@/hooks/useFavorites', () => ({
  useToggleFavorite: jest.fn(),
}));

const mockedUseUserProfile = jest.mocked(useUserProfile);
const mockedUseToggleFavorite = jest.mocked(useToggleFavorite);

describe('MyFavoritesScreen', () => {
  const mutateMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseToggleFavorite.mockReturnValue({
      mutate: mutateMock,
    } as unknown as ReturnType<typeof useToggleFavorite>);
  });

  it('renderiza todos os pets favoritados pelo usuário e permite desfavoritar ou abrir detalhes', async () => {
    mockedUseUserProfile.mockReturnValue({
      data: {
        id: 'user-1',
        latitude: null,
        longitude: null,
        counts: { favorites: 3, adoptions: 0, events: 0 },
        events: [],
        favorites: [
          {
            userId: 'user-1',
            animalId: 'pet-1',
            createdAt: '2026-11-05T10:00:00.000Z',
            animal: {
              id: 'pet-1',
              name: 'Thor',
              gender: 'male',
              age: 2,
              photo: 'https://example.com/thor.jpg',
            },
          },
          {
            userId: 'user-1',
            animalId: 'pet-2',
            createdAt: '2026-11-04T10:00:00.000Z',
            animal: {
              id: 'pet-2',
              name: 'Luna',
              gender: 'female',
              age: 1,
              photo: 'https://example.com/luna.jpg',
            },
          },
          {
            userId: 'user-1',
            animalId: 'pet-3',
            createdAt: '2026-11-03T10:00:00.000Z',
            animal: {
              id: 'pet-3',
              name: 'Mel',
              gender: 'female',
              age: 0,
              photo: 'https://example.com/mel.jpg',
            },
          },
        ],
      },
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useUserProfile>);

    await render(<MyFavoritesScreen />);

    expect(screen.getByText('Meus Favoritos')).toBeTruthy();
    expect(screen.getByText('Thor')).toBeTruthy();
    expect(screen.getByText('Luna')).toBeTruthy();
    expect(screen.getByText('Mel')).toBeTruthy();

    await fireEvent.press(screen.getByText('Thor'));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/adopet/[id]',
      params: { id: 'pet-1' },
    });

    await fireEvent.press(screen.getByLabelText('Remover Luna dos favoritos'));
    expect(mutateMock).toHaveBeenCalledWith('pet-2');
  });

  it('exibe estado vazio com botão para explorar a vitrine quando não há favoritos', async () => {
    mockedUseUserProfile.mockReturnValue({
      data: {
        id: 'user-1',
        latitude: null,
        longitude: null,
        counts: { favorites: 0, adoptions: 0, events: 0 },
        events: [],
        favorites: [],
      },
      isLoading: false,
      isRefetching: false,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useUserProfile>);

    await render(<MyFavoritesScreen />);

    expect(screen.getByText('Nenhum pet favoritado ainda')).toBeTruthy();
    await fireEvent.press(screen.getByText('Explorar pets para adoção'));
    expect(router.push).toHaveBeenCalledWith('/adopet');
  });
});
