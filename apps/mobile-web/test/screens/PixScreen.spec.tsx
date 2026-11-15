import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { PixScreen, PIX_CONFIG } from '../../src/screens/pix';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { createPixBrCode } from '../../src/screens/pix/brCode';

jest.mock('expo-router', () => ({
  router: {
    back: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    canGoBack: jest.fn(() => true),
  },
}));

jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn().mockResolvedValue(true),
}));

describe('PixScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title, key and recipient details correctly', async () => {
    await render(<PixScreen />);

    expect(screen.getByText('Doar via PIX')).toBeTruthy();
    expect(screen.getAllByText(PIX_CONFIG.keyValue).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(PIX_CONFIG.recipientName)).toBeTruthy();
    expect(screen.getByText(PIX_CONFIG.bankName)).toBeTruthy();
  });

  it('renders all suggested donation amount chips', async () => {
    await render(<PixScreen />);

    for (const amount of PIX_CONFIG.suggestedAmounts) {
      expect(screen.getByText(`R$ ${amount}`)).toBeTruthy();
    }
  });

  it('allows selecting and toggling donation amount chips', async () => {
    await render(<PixScreen />);

    const chip50 = screen.getByText('R$ 50');
    await fireEvent.press(chip50);

    expect(screen.getByText(/Com R\$ 50, você ajuda a alimentar até 10 animais/i)).toBeTruthy();
  });

  it('copies PIX key to clipboard and changes button state to copied', async () => {
    await render(<PixScreen />);

    const copyButton = screen.getByRole('button', {
      name: 'Copiar chave PIX para a área de transferência',
    });
    await fireEvent.press(copyButton);

    expect(Clipboard.setStringAsync).toHaveBeenCalledWith(PIX_CONFIG.keyValue);
    expect(screen.getByText('Chave Copiada com Sucesso!')).toBeTruthy();
  });

  it('shows a QR code, follows the selected amount and allows hiding it', async () => {
    await render(<PixScreen />);

    const qrLabel = 'QR Code Pix para doação';
    expect(screen.queryByLabelText(qrLabel)).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Gerar QR Code' }));
    expect(screen.getByLabelText(qrLabel)).toBeTruthy();
    expect(screen.getByText(/para doar R\$ 25/)).toBeTruthy();

    await fireEvent.press(screen.getByText('R$ 50'));
    expect(screen.getByText(/para doar R\$ 50/)).toBeTruthy();
    await fireEvent.press(screen.getByText('R$ 50'));
    expect(screen.getByText(/informe o valor da doação/)).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Ocultar QR Code' }));
    expect(screen.queryByLabelText(qrLabel)).toBeNull();
  });

  it('navigates back when back button is pressed', async () => {
    await render(<PixScreen />);

    const backButton = screen.getByLabelText('Voltar para a tela anterior');
    await fireEvent.press(backButton);

    expect(router.back).toHaveBeenCalledTimes(1);
  });
});

describe('createPixBrCode', () => {
  it('matches the Banco Central example for a static QR code without an amount', () => {
    expect(createPixBrCode({
      keyValue: '123e4567-e12b-12d1-a456-426655440000',
      recipientName: 'Fulano de Tal',
      city: 'BRASÍLIA',
    }, null)).toBe(
      '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D',
    );
  });

  it('encodes the official CNPJ and two decimal places for the selected amount', () => {
    const payload = createPixBrCode(PIX_CONFIG, 50);
    expect(payload).toContain('26360014br.gov.bcb.pix0114' + PIX_CONFIG.keyValue);
    expect(payload).toContain('5303986540550.005802BR');
    expect(createPixBrCode(PIX_CONFIG, null)).toContain('53039865802BR');
  });
});
