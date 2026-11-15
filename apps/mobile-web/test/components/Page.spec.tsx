import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { router } from 'expo-router';
import { Page } from '../../src/components/layout/Page';

jest.mock('expo-router', () => ({ router: { replace: jest.fn() } }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View };
});

describe('Page', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renderiza o conteúdo e o botão voltar padrão', async () => {
    await render(
      <Page>
        <Text>Conteúdo</Text>
      </Page>,
    );

    expect(screen.getByText('Conteúdo')).toBeTruthy();
    expect(screen.getByLabelText('Voltar para Início')).toBeTruthy();
  });

  it('volta para o início por padrão', async () => {
    await render(
      <Page>
        <Text>Conteúdo</Text>
      </Page>,
    );

    await fireEvent.press(screen.getByLabelText('Voltar para Início'));

    expect(router.replace).toHaveBeenCalledWith('/(protected)/(tabs)');
  });

  it('usa o rótulo e a ação de voltar informados', async () => {
    const onBack = jest.fn();
    await render(
      <Page backLabel="Perfil" onBack={onBack}>
        <Text>Conteúdo</Text>
      </Page>,
    );

    await fireEvent.press(screen.getByLabelText('Voltar para Perfil'));

    expect(onBack).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('oculta o botão voltar quando backLabel é null', async () => {
    await render(
      <Page backLabel={null} width="form">
        <Text>Conteúdo</Text>
      </Page>,
    );

    expect(screen.getByText('Conteúdo')).toBeTruthy();
    expect(screen.queryByLabelText(/^Voltar para/)).toBeNull();
  });
});
