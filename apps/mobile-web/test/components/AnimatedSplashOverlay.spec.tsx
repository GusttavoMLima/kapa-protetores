import { AnimatedSplashOverlay } from '@/components/splash/AnimatedSplashOverlay';
import { act, render } from '@testing-library/react-native';

describe('AnimatedSplashOverlay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renderiza o logo e a mensagem institucional da KAPA Protetores', async () => {
    const onAnimationComplete = jest.fn();

    const { getByTestId, getByText } = await render(
      <AnimatedSplashOverlay onAnimationComplete={onAnimationComplete} />,
    );

    expect(getByTestId('animated-splash-overlay')).toBeTruthy();
    expect(getByText('KAPA Protetores')).toBeTruthy();
    expect(
      getByText('Cuidado, acolhimento e adoção responsável'),
    ).toBeTruthy();
  });

  it('invoca onAnimationComplete ao concluir a sequência de animação', async () => {
    const onAnimationComplete = jest.fn();

    await render(
      <AnimatedSplashOverlay onAnimationComplete={onAnimationComplete} />,
    );

    expect(onAnimationComplete).not.toHaveBeenCalled();

    await act(async () => {
      jest.advanceTimersByTime(2000);
    });

    expect(onAnimationComplete).toHaveBeenCalledTimes(1);
  });
});
