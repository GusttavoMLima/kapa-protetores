import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { EditProfileScreen } from '../../src/screens/editProfile';
import { router } from 'expo-router';
import { updateUserProfile, uploadUserAvatar } from '../../src/services/userService';

const mockCanGoBack = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    canGoBack: () => mockCanGoBack(),
    back: () => mockBack(),
    replace: (...args: unknown[]) => mockReplace(...args),
    push: (...args: unknown[]) => mockPush(...args),
  },
}));

const mockUpdateUserData = jest.fn().mockResolvedValue(undefined);
const mockUser = {
  id: 'user-1',
  birthDate: '1990-01-01',
  phone: '19999998888',
  username: 'Danilo Silva',
  email: 'danilo@example.com',
  avatar: 'https://example.com/danilo.jpg',
  role: 'adopter',
  rules: [],
  createdAt: '2026-01-01T00:00:00.000Z',
};

jest.mock('../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    updateUserData: mockUpdateUserData,
  }),
}));

const mockInvalidateQueries = jest.fn().mockResolvedValue(undefined);
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

jest.mock('../../src/services/userService', () => ({
  updateUserProfile: jest.fn(),
  uploadUserAvatar: jest.fn(),
}));

describe('EditProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCanGoBack.mockReturnValue(true);
    (updateUserProfile as jest.Mock).mockResolvedValue({
      ...mockUser,
      username: 'Danilo Atualizado',
      email: 'danilo.novo@example.com',
    });
    (uploadUserAvatar as jest.Mock).mockResolvedValue('https://storage.example.com/new-avatar.jpg');
  });

  it('renders header, title, description, and inputs with user data', async () => {
    await render(<EditProfileScreen />);

    expect(screen.getByText('Editar Perfil')).toBeTruthy();
    expect(
      screen.getByText(
        'Atualize sua foto, nome de exibição e e-mail da sua conta.',
      ),
    ).toBeTruthy();
    expect(screen.getByDisplayValue('Danilo Silva')).toBeTruthy();
    expect(screen.getByDisplayValue('danilo@example.com')).toBeTruthy();
    expect(screen.getByLabelText('Alterar foto de perfil')).toBeTruthy();
    expect(screen.getByText('Preferências de Adoção')).toBeTruthy();
  });

  it('navigates back when back button is clicked', async () => {
    mockCanGoBack.mockReturnValue(true);
    await render(<EditProfileScreen />);

    const backButton = screen.getByLabelText('Voltar para a tela anterior');
    await fireEvent.press(backButton);

    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('navigates to adopter preferences when adopter preferences card is clicked', async () => {
    await render(<EditProfileScreen />);

    const prefsButton = screen.getByLabelText('Editar preferências de adoção');
    await fireEvent.press(prefsButton);

    expect(mockPush).toHaveBeenCalledWith('/(protected)/adopter-profile');
  });

  it('validates minimum name length', async () => {
    await render(<EditProfileScreen />);

    const nameInput = screen.getByDisplayValue('Danilo Silva');
    await fireEvent.changeText(nameInput, 'ab');

    const saveButton = screen.getByLabelText('Salvar alterações do perfil');
    await fireEvent.press(saveButton);

    expect(
      screen.getByText('Nome deve ter no mínimo 3 caracteres'),
    ).toBeTruthy();
    expect(updateUserProfile).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    await render(<EditProfileScreen />);

    const emailInput = screen.getByDisplayValue('danilo@example.com');
    await fireEvent.changeText(emailInput, 'invalid-email');

    const saveButton = screen.getByLabelText('Salvar alterações do perfil');
    await fireEvent.press(saveButton);

    expect(screen.getByText('Formato de e-mail inválido')).toBeTruthy();
    expect(updateUserProfile).not.toHaveBeenCalled();
  });

  it('submits updated profile and updates auth user data', async () => {
    await render(<EditProfileScreen />);

    const nameInput = screen.getByDisplayValue('Danilo Silva');
    await fireEvent.changeText(nameInput, 'Danilo Santos');

    const emailInput = screen.getByDisplayValue('danilo@example.com');
    await fireEvent.changeText(emailInput, 'danilo.santos@example.com');

    const saveButton = screen.getByLabelText('Salvar alterações do perfil');
    await fireEvent.press(saveButton);

    await waitFor(() => {
      expect(updateUserProfile).toHaveBeenCalledWith({
        birthDate: '1990-01-01',
        phone: '19999998888',
        username: 'Danilo Santos',
        email: 'danilo.santos@example.com',
        avatar: 'https://example.com/danilo.jpg',
      });
      expect(mockUpdateUserData).toHaveBeenCalled();
      expect(screen.getByText('Perfil atualizado com sucesso!')).toBeTruthy();
    });
  });
});
