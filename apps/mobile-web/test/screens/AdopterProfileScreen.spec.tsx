import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { AdopterProfileScreen } from '../../src/screens/adopterProfile';

const mockSignOut = jest.fn();
const mockMutate = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    canGoBack: jest.fn(() => true),
    replace: jest.fn(),
  },
}));

jest.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    signOut: mockSignOut,
    user: { id: 'user-1', role: 'adopter', username: 'TestUser' },
    isLogged: true,
    hasAdopterProfile: false,
  }),
}));

jest.mock('../../src/hooks/useAdopterProfile', () => ({
  useAdopterProfile: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
  useAdopterProfileMe: () => ({
    data: null,
    isLoading: false,
  }),
}));

describe('AdopterProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders header with title and sign out button', async () => {
    await render(<AdopterProfileScreen />);

    expect(screen.getByText('Perfil de Adoção')).toBeTruthy();
    expect(screen.getByText('Sair')).toBeTruthy();
  });

  it('calls signOut when sign out button is pressed', async () => {
    await render(<AdopterProfileScreen />);

    const signOutBtn = screen.getByText('Sair');
    await fireEvent.press(signOutBtn);

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });

  it('renders the initial form step for adoption preferences', async () => {
    await render(<AdopterProfileScreen />);

    expect(
      screen.getByText('Qual espécie de animal você prefere?'),
    ).toBeTruthy();
    expect(screen.getByText('Passo 1 de 9')).toBeTruthy();
  });
});
