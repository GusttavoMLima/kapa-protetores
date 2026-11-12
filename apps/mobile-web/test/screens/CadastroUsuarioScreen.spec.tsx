import { fireEvent, render } from '@testing-library/react-native';
import { router } from 'expo-router';
import { CadastroUsuarioScreen } from '@/screens/cadastroVoluntario';

jest.mock('expo-router', () => ({
  router: { back: jest.fn(), canGoBack: jest.fn(), replace: jest.fn() },
}));
jest.mock('@/services/api', () => ({ apiRequest: jest.fn() }));

describe('CadastroUsuarioScreen', () => {
  beforeEach(() => jest.clearAllMocks());

  it.each([true, false])('offers a way back when navigation history is %s', async (hasHistory) => {
    jest.mocked(router.canGoBack).mockReturnValue(hasHistory);
    const screen = await render(<CadastroUsuarioScreen />);
    await fireEvent.press(screen.getByRole('button', { name: 'Voltar para Gestão do abrigo' }));

    if (hasHistory) {
      expect(router.back).toHaveBeenCalledTimes(1);
      expect(router.replace).not.toHaveBeenCalled();
    } else {
      expect(router.replace).toHaveBeenCalledWith('/(protected)/(tabs)');
      expect(router.back).not.toHaveBeenCalled();
    }
  });
});
