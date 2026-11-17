import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useIsFocused, useLocalSearchParams } from 'expo-router';
import { FreshOnFocus } from '../../src/components/layout/FreshOnFocus';

jest.mock('expo-router', () => ({
  useIsFocused: jest.fn(),
  useLocalSearchParams: jest.fn(),
}));

const mockedIsFocused = jest.mocked(useIsFocused);
const mockedParams = jest.mocked(useLocalSearchParams);

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <Pressable accessibilityRole="button" onPress={() => setCount((c) => c + 1)}>
      <Text>{`Contagem ${count}`}</Text>
    </Pressable>
  );
}

const tree = () => (
  <FreshOnFocus>
    <Counter />
  </FreshOnFocus>
);

describe('FreshOnFocus', () => {
  beforeEach(() => {
    mockedIsFocused.mockReturnValue(true);
    mockedParams.mockReturnValue({ id: 'a' });
  });

  it('não renderiza a tela fora de foco', async () => {
    mockedIsFocused.mockReturnValue(false);
    await render(tree());

    expect(screen.queryByText(/Contagem/)).toBeNull();
  });

  it('recria a tela ao voltar ao foco, descartando o estado anterior', async () => {
    const { rerender } = await render(tree());
    await fireEvent.press(screen.getByRole('button'));
    expect(screen.getByText('Contagem 1')).toBeTruthy();

    mockedIsFocused.mockReturnValue(false);
    await rerender(tree());
    mockedIsFocused.mockReturnValue(true);
    await rerender(tree());

    expect(screen.getByText('Contagem 0')).toBeTruthy();
  });

  it('recria a tela quando os parâmetros mudam (outro pet)', async () => {
    const { rerender } = await render(tree());
    await fireEvent.press(screen.getByRole('button'));
    expect(screen.getByText('Contagem 1')).toBeTruthy();

    mockedParams.mockReturnValue({ id: 'b' });
    await rerender(tree());

    expect(screen.getByText('Contagem 0')).toBeTruthy();
  });

  it('mantém o estado enquanto a tela segue em foco com os mesmos parâmetros', async () => {
    const { rerender } = await render(tree());
    await fireEvent.press(screen.getByRole('button'));

    await rerender(tree());

    expect(screen.getByText('Contagem 1')).toBeTruthy();
  });
});
