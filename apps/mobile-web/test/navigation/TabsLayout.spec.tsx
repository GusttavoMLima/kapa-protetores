import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react-native';
import TabLayout from '../../app/(protected)/(tabs)/_layout';
import { useAuth } from '@/hooks/useAuth';

type ScreenProps = { name: string; options?: Record<string, unknown> };
type TabsProps = { children: ReactNode; backBehavior?: string; screenOptions?: Record<string, unknown> };

const mockTabs: { props?: TabsProps; screens: ScreenProps[] } = { screens: [] };

jest.mock('expo-router', () => {
  const Tabs = ({ children, ...props }: TabsProps) => {
    mockTabs.props = { children, ...props };
    return children;
  };
  Tabs.Screen = (props: ScreenProps) => {
    mockTabs.screens.push(props);
    return null;
  };
  const { Text: MockText } = jest.requireActual('react-native');
  return {
    Tabs,
    Redirect: ({ href }: { href: string }) => <MockText>{`redirect:${href}`}</MockText>,
  };
});
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 47, bottom: 34, left: 0, right: 0 }) }));
jest.mock('@/components/header/default', () => ({ DefaultHeader: () => null }));
jest.mock('@/hooks/useAuth', () => ({ useAuth: jest.fn() }));

const mockedUseAuth = jest.mocked(useAuth);

function setRole(role: string, hasAdopterProfile: boolean | null = true) {
  mockedUseAuth.mockReturnValue({ user: { role }, hasAdopterProfile, isCheckingProfile: false } as unknown as ReturnType<typeof useAuth>);
}

const screenNamed = (name: string) => mockTabs.screens.find((s) => s.name === name);

describe('layout das abas', () => {
  beforeEach(() => {
    mockTabs.props = undefined;
    mockTabs.screens = [];
  });

  it('mantém as telas internas nas abas, ocultas da barra', async () => {
    setRole('admin');
    await render(<TabLayout />);

    for (const name of ['gestao/usuarios', 'gestao/animais', 'my-events', 'pix', 'adopet/[id]', 'adopet/[id]/application', 'cadastro-animal', 'edit-profile']) {
      expect(screenNamed(name)?.options).toEqual({ href: null });
    }
    expect(mockTabs.props?.backBehavior).toBe('history');
  });

  it('soma a área segura do iPhone à barra de abas', async () => {
    setRole('admin');
    await render(<TabLayout />);

    const style = (mockTabs.props?.screenOptions as { tabBarStyle: { height: number; paddingBottom: number } }).tabBarStyle;
    expect(style.height).toBe(76 + 34);
    expect(style.paddingBottom).toBe(12 + 34);
  });

  it('mostra só as abas do papel', async () => {
    setRole('adopter');
    await render(<TabLayout />);

    expect(screenNamed('index')?.options?.href).toBeNull();
    expect(screenNamed('adopet')?.options?.href).toBe('/adopet');
    expect(screenNamed('activities')?.options?.href).toBeNull();
  });

  it('manda o adotante sem perfil para o cadastro inicial', async () => {
    setRole('adopter', false);
    await render(<TabLayout />);

    expect(screen.getByText('redirect:/(protected)/adopter-profile')).toBeTruthy();
    expect(mockTabs.props).toBeUndefined();
  });
});

