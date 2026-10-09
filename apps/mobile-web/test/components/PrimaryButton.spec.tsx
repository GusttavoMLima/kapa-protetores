import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { PrimaryButton } from '../../src/components/buttons/primary';

describe('PrimaryButton', () => {
  it('renders button title correctly', async () => {
    await render(<PrimaryButton title="Confirmar" />);
    expect(screen.getByText('Confirmar')).toBeTruthy();
  });

  it('handles press event when interactive', async () => {
    const onPressMock = jest.fn();
    await render(
      <PrimaryButton title="Clique aqui" onPress={onPressMock} />,
    );
    fireEvent.press(screen.getByText('Clique aqui'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('does not trigger press when disabled', async () => {
    const onPressMock = jest.fn();
    await render(
      <PrimaryButton title="Bloqueado" disabled onPress={onPressMock} />,
    );
    fireEvent.press(screen.getByRole('button'));
    expect(onPressMock).not.toHaveBeenCalled();
  });

  it('renders loading indicator when loading is true', async () => {
    await render(
      <PrimaryButton title="Salvando..." loading />,
    );
    expect(screen.queryByText('Salvando...')).toBeNull();
    const button = screen.getByRole('button');
    expect(button.props.accessibilityState.busy).toBe(true);
  });
});
