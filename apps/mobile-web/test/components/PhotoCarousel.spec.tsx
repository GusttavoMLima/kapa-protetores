import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { PhotoCarousel } from '../../src/components/carousels/photo';

const samplePhotos = [
  { id: 'photo-1', photoUrl: 'https://example.com/photo-1.jpg' },
  { id: 'photo-2', photoUrl: 'https://example.com/photo-2.jpg' },
  { id: 'photo-3', photoUrl: 'https://example.com/photo-3.jpg' },
];

describe('PhotoCarousel', () => {
  it('returns null when photos array is empty', async () => {
    const { toJSON } = await render(<PhotoCarousel photos={[]} />);
    expect(toJSON()).toBeNull();
  });

  it('renders a single photo without navigation controls and switches to cover when horizontal', async () => {
    await render(<PhotoCarousel photos={[samplePhotos[0]]} />);
    const photos = screen.getAllByLabelText('Foto do animal');
    expect(photos).toHaveLength(1);
    expect(photos[0].props.resizeMode).toBe('contain');
    expect(screen.queryByLabelText('Foto anterior')).toBeNull();
    expect(screen.queryByLabelText('Próxima foto')).toBeNull();

    await fireEvent(photos[0], 'load', {
      nativeEvent: { source: { width: 1600, height: 900 } },
    });

    expect(screen.getByLabelText('Foto do animal').props.resizeMode).toBe(
      'cover',
    );
  });

  it('updates counter and buttons when navigating or dragging', async () => {
    await render(<PhotoCarousel photos={samplePhotos} />);

    expect(screen.getByText('1/3')).toBeTruthy();
    expect(
      screen.getByLabelText('Foto anterior').props.accessibilityState?.disabled,
    ).toBe(true);

    await fireEvent.press(screen.getByLabelText('Próxima foto'));
    expect(screen.getByText('2/3')).toBeTruthy();
    expect(
      screen.getByLabelText('Foto anterior').props.accessibilityState?.disabled,
    ).toBe(false);
  });

  it('renders and navigates via pagination dots when dots is true', async () => {
    await render(<PhotoCarousel photos={samplePhotos} dots />);

    await fireEvent.press(screen.getByLabelText('Ir para foto 3'));
    expect(
      screen.getByLabelText('Próxima foto').props.accessibilityState?.disabled,
    ).toBe(true);
  });
});
