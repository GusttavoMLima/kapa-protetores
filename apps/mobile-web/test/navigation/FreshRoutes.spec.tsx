import type { ComponentType, ReactNode } from 'react';
import { render, screen } from '@testing-library/react-native';
import { useIsFocused } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import CadastroAnimalRoute from '../../app/(protected)/(tabs)/cadastro-animal';
import CadastroUsuarioRoute from '../../app/(protected)/(tabs)/cadastro-usuario';
import EditProfileRoute from '../../app/(protected)/(tabs)/edit-profile';
import AdoptPetDetailsRoute from '../../app/(protected)/(tabs)/adopet/[id]';
import AdoptionApplicationRoute from '../../app/(protected)/(tabs)/adopet/[id]/application';

jest.mock('expo-router', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    useIsFocused: jest.fn(() => true),
    useLocalSearchParams: jest.fn(() => ({ id: 'pet-1' })),
    Redirect: ({ href }: { href: string }) => <Text>{`redirect:${href}`}</Text>,
  };
});
jest.mock('@/hooks/useAuth', () => ({ useAuth: jest.fn() }));

// Declaração de função: sobe junto com os jest.mock abaixo.
function mockScreen(label: string) {
  const { Text } = jest.requireActual('react-native');
  return () => <Text>{label}</Text>;
}
jest.mock('@/screens/cadastroAnimal', () => ({ CadastroAnimalScreen: mockScreen('tela cadastro animal') }));
jest.mock('@/screens/cadastroVoluntario', () => ({ CadastroUsuarioScreen: mockScreen('tela cadastro usuario') }));
jest.mock('@/screens/editProfile', () => ({ EditProfileScreen: mockScreen('tela editar perfil') }));
jest.mock('@/screens/adopt/details', () => ({ AdoptPetDetailsScreen: mockScreen('tela detalhes do pet') }));
jest.mock('@/screens/adopt/application', () => ({ AdoptionApplicationScreen: mockScreen('tela ficha de adocao') }));
jest.mock('@/screens/animalManagement/components', () => ({
  AnimalAccess: ({ children }: { children: ReactNode }) => children,
}));

const mockedUseAuth = jest.mocked(useAuth);
const mockedIsFocused = jest.mocked(useIsFocused);

describe('rotas que recomeçam a cada visita', () => {
  beforeEach(() => {
    mockedIsFocused.mockReturnValue(true);
    mockedUseAuth.mockReturnValue({ isLogged: true, isReady: true, user: { role: 'admin' } } as unknown as ReturnType<typeof useAuth>);
  });

  it.each([
    [CadastroAnimalRoute, 'tela cadastro animal'],
    [CadastroUsuarioRoute, 'tela cadastro usuario'],
    [EditProfileRoute, 'tela editar perfil'],
    [AdoptPetDetailsRoute, 'tela detalhes do pet'],
    [AdoptionApplicationRoute, 'tela ficha de adocao'],
  ] as [ComponentType, string][])('mostra a tela em foco e a esconde fora de foco (%#)', async (Route, label) => {
    const { rerender } = await render(<Route />);
    expect(screen.getByText(label)).toBeTruthy();

    mockedIsFocused.mockReturnValue(false);
    await rerender(<Route />);
    expect(screen.queryByText(label)).toBeNull();
  });

  it('cadastro de usuário espera a sessão e manda quem não entrou para o login', async () => {
    mockedUseAuth.mockReturnValue({ isLogged: false, isReady: false, user: null } as unknown as ReturnType<typeof useAuth>);
    const { rerender } = await render(<CadastroUsuarioRoute />);
    expect(screen.queryByText('tela cadastro usuario')).toBeNull();
    expect(screen.queryByText(/^redirect:/)).toBeNull();

    mockedUseAuth.mockReturnValue({ isLogged: false, isReady: true, user: null } as unknown as ReturnType<typeof useAuth>);
    await rerender(<CadastroUsuarioRoute />);
    expect(screen.getByText('redirect:/signIn')).toBeTruthy();
  });

  it('cadastro de usuário continua exclusivo do administrador', async () => {
    mockedUseAuth.mockReturnValue({ isLogged: true, isReady: true, user: { role: 'protector' } } as unknown as ReturnType<typeof useAuth>);
    await render(<CadastroUsuarioRoute />);

    expect(screen.getByText('redirect:/unauthorized')).toBeTruthy();
  });
});
