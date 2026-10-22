import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { MultiFotoPicker } from '../../src/components/photoPicker/animal';

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ granted: true }),
  requestCameraPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ granted: true }),
  launchImageLibraryAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));

describe('MultiFotoPicker (Issue #48)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders empty state with counter and add photos button', async () => {
    await render(<MultiFotoPicker uris={[]} onChange={jest.fn()} maxPhotos={5} />);

    expect(screen.getByText('Fotos do animal')).toBeTruthy();
    expect(
      screen.getByText('Adicione até 5 fotos (0/5 selecionadas)'),
    ).toBeTruthy();
    expect(screen.getByLabelText('Adicionar fotos')).toBeTruthy();
  });

  it('selects multiple photos from gallery and merges them up to maxPhotos', async () => {
    const onChange = jest.fn();
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [
        { uri: 'file:///pet-2.jpg' },
        { uri: 'file:///pet-3.jpg' },
      ],
    });

    await render(
      <MultiFotoPicker
        uris={['file:///pet-1.jpg']}
        onChange={onChange}
        maxPhotos={5}
      />,
    );

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Adicionar fotos'));
    });

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Escolher fotos da galeria'));
    });

    expect(ImagePicker.launchImageLibraryAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        allowsMultipleSelection: true,
        selectionLimit: 4,
      }),
    );
    expect(onChange).toHaveBeenCalledWith([
      'file:///pet-1.jpg',
      'file:///pet-2.jpg',
      'file:///pet-3.jpg',
    ]);
  });

  it('renders Capa badge on first photo and removes an individual photo when trash button is pressed', async () => {
    const onChange = jest.fn();
    await render(
      <MultiFotoPicker
        uris={['file:///pet-1.jpg', 'file:///pet-2.jpg']}
        onChange={onChange}
      />,
    );

    expect(screen.getByText('Capa')).toBeTruthy();

    await act(async () => {
      fireEvent.press(screen.getByLabelText('Remover foto 1'));
    });

    expect(onChange).toHaveBeenCalledWith(['file:///pet-2.jpg']);
  });

  it('hides the add button when maxPhotos is reached', async () => {
    await render(
      <MultiFotoPicker
        uris={['file:///1.jpg', 'file:///2.jpg', 'file:///3.jpg']}
        onChange={jest.fn()}
        maxPhotos={3}
      />,
    );

    expect(
      screen.getByText('Adicione até 3 fotos (3/3 selecionadas)'),
    ).toBeTruthy();
    expect(screen.queryByLabelText('Adicionar fotos')).toBeNull();
  });
});
