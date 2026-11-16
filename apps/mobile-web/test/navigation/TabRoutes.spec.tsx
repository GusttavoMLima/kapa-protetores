import type { ComponentType, ReactNode } from 'react';
import { render, screen } from '@testing-library/react-native';
import MyAdoptionsRoute from '../../app/(protected)/(tabs)/my-adoptions';
import MyEventsRoute from '../../app/(protected)/(tabs)/my-events';
import MyFavoritesRoute from '../../app/(protected)/(tabs)/my-favorites';
import PixRoute from '../../app/(protected)/(tabs)/pix';
import ManageActivitiesRoute from '../../app/(protected)/(tabs)/manage-activities';
import CadastroVoluntarioRoute from '../../app/(protected)/(tabs)/cadastro-voluntario';
import AnimalManagementLayout from '../../app/(protected)/(tabs)/gestao/animais/_layout';

jest.mock('expo-router', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    Redirect: ({ href }: { href: string }) => <Text>{`redirect:${href}`}</Text>,
    Stack: () => <Text>pilha de animais</Text>,
  };
});

// Declaração de função: sobe junto com os jest.mock abaixo.
function mockScreen(label: string) {
  const { Text } = jest.requireActual('react-native');
  return () => <Text>{label}</Text>;
}
jest.mock('@/screens/myAdoptions', () => ({ MyAdoptionsScreen: mockScreen('tela minhas solicitacoes') }));
jest.mock('@/screens/myEvents', () => ({ MyEventsScreen: mockScreen('tela meus eventos') }));
jest.mock('@/screens/myFavorites', () => ({ MyFavoritesScreen: mockScreen('tela favoritos') }));
jest.mock('@/screens/pix', () => ({ PixScreen: mockScreen('tela pix') }));
jest.mock('@/screens/activities', () => ({ ActivitiesScreen: mockScreen('tela atividades') }));
jest.mock('@/screens/animalManagement/components', () => ({
  AnimalAccess: ({ children }: { children: ReactNode }) => children,
}));

describe('rotas internas das abas', () => {
  it.each([
    [MyAdoptionsRoute, 'tela minhas solicitacoes'],
    [MyEventsRoute, 'tela meus eventos'],
    [MyFavoritesRoute, 'tela favoritos'],
    [PixRoute, 'tela pix'],
    [ManageActivitiesRoute, 'tela atividades'],
    [AnimalManagementLayout, 'pilha de animais'],
  ] as [ComponentType, string][])('renderiza a tela da rota (%#)', async (Route, label) => {
    await render(<Route />);

    expect(screen.getByText(label)).toBeTruthy();
  });

  it('mantém o endereço antigo do cadastro de voluntário apontando para o de usuário', async () => {
    await render(<CadastroVoluntarioRoute />);

    expect(screen.getByText('redirect:/cadastro-usuario')).toBeTruthy();
  });
});
