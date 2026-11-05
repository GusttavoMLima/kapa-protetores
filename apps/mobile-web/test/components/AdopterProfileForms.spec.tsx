import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { AdopterProfileForms } from '../../src/components/forms/adopterProfile';

describe('AdopterProfileForms', () => {
  it('renders current step title, description, and progress indicator', async () => {
    await render(
      <AdopterProfileForms
        onNext={() => null}
        currentField={0}
        onSubmit={jest.fn()}
      />,
    );

    expect(
      screen.getByText('Qual espécie de animal você prefere?'),
    ).toBeTruthy();
    expect(
      screen.getByText('Escolha a espécie que melhor se adapta à sua família.'),
    ).toBeTruthy();
    expect(screen.getByText('Passo 1 de 9')).toBeTruthy();
    expect(screen.getByText('11%')).toBeTruthy();
    expect(screen.getByTestId('adopter-profile-progress-bar')).toBeTruthy();
  });

  it('allows selecting an option and advancing to next step', async () => {
    const onNextMock = jest.fn();

    await render(
      <AdopterProfileForms
        onNext={onNextMock}
        currentField={0}
        onSubmit={jest.fn()}
      />,
    );

    const dogOption = screen.getByText('Cão');
    await fireEvent.press(dogOption);

    const nextButton = screen.getByText('Avançar');
    await fireEvent.press(nextButton);

    expect(onNextMock).toHaveBeenCalledTimes(1);
  });

  it('renders back button when currentField > 0 and onBack is provided', async () => {
    const onBackMock = jest.fn();

    await render(
      <AdopterProfileForms
        onNext={() => null}
        currentField={1}
        onSubmit={jest.fn()}
        onBack={onBackMock}
      />,
    );

    const backButton = screen.getByText('Voltar');
    expect(backButton).toBeTruthy();

    await fireEvent.press(backButton);
    expect(onBackMock).toHaveBeenCalledTimes(1);
  });

  it('renders chips with PrimaryChip and allows selection on chip steps', async () => {
    const onNextMock = jest.fn();

    await render(
      <AdopterProfileForms
        onNext={onNextMock}
        currentField={1}
        onSubmit={jest.fn()}
      />,
    );

    expect(screen.getByText('Qual o sexo de preferência?')).toBeTruthy();
    const femaleChip = screen.getByText('Fêmea');
    await fireEvent.press(femaleChip);

    const nextButton = screen.getByText('Avançar');
    await fireEvent.press(nextButton);

    expect(onNextMock).toHaveBeenCalledTimes(1);
  });

  it('submits completed form on the last step', async () => {
    const onSubmitMock = jest.fn();

    await render(
      <AdopterProfileForms
        onNext={() => null}
        currentField={8}
        onSubmit={onSubmitMock}
        initialValues={{
          preferredSpecies: 'dog',
          preferredGender: 'female',
          preferredSize: 2,
          preferredAgeStage: 1,
          preferredEnergy: 2,
          preferredKidFriendly: 2,
          preferredNoise: 2,
          livesInApartment: true,
          hasOtherPets: false,
        }}
      />,
    );

    const finishButton = screen.getByText('Concluir Perfil');
    await fireEvent.press(finishButton);

    expect(onSubmitMock).toHaveBeenCalledTimes(1);
    expect(onSubmitMock).toHaveBeenCalledWith(
      expect.objectContaining({
        preferredSpecies: 'dog',
        preferredGender: 'female',
      }),
    );
  });

  it('renders conclusion text when step index is beyond total config steps', async () => {
    await render(
      <AdopterProfileForms
        onNext={() => null}
        currentField={99}
        onSubmit={jest.fn()}
      />,
    );

    expect(screen.getByText('Perfil Concluído!')).toBeTruthy();
  });
});
