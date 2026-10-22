import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PetCard } from '../../src/components/cards/pet';

describe('PetCard', () => {
  it('renders vertical photos with contain mode and switches to cover for horizontal photos', async () => {
    await render(
      <PetCard
        name="Thor"
        imgUrl="https://example.com/thor.jpg"
        characteristics={['Macho', 'Porte Grande', '2 anos']}
      />,
    );

    expect(screen.getByText('Thor')).toBeTruthy();
    expect(screen.getByText('Macho • Porte Grande • 2 anos')).toBeTruthy();
    const photo = screen.getByLabelText('Foto de Thor');
    expect(photo.props.resizeMode).toBe('contain');

    await fireEvent(photo, 'load', {
      nativeEvent: { source: { width: 1200, height: 800 } },
    });

    expect(screen.getByLabelText('Foto de Thor').props.resizeMode).toBe(
      'cover',
    );
  });

  it('triggers onPress and onToggleFavorite callbacks', async () => {
    const onPress = jest.fn();
    const onToggleFavorite = jest.fn();

    await render(
      <PetCard
        name="Luna"
        imgUrl="https://example.com/luna.jpg"
        isFavorited={false}
        onPress={onPress}
        onToggleFavorite={onToggleFavorite}
      />,
    );

    await fireEvent.press(screen.getByText('Luna'));
    expect(onPress).toHaveBeenCalledTimes(1);

    await fireEvent.press(screen.getByLabelText('Favoritar Luna'));
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });

  it('falls back gracefully when image fails to load', async () => {
    await render(
      <PetCard
        name="Bolinha"
        imgUrl="https://example.com/broken.jpg"
      />,
    );

    const photo = screen.getByLabelText('Foto de Bolinha');
    await fireEvent(photo, 'error');

    expect(screen.getByLabelText('Foto de Bolinha')).toBeTruthy();
  });
});
