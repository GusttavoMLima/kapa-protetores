import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { User } from '@kapa/shared';
import { EligibilityNotice } from '../../src/components/feedback/EligibilityNotice';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), replace: jest.fn() } }));

const user = (birthDate?: string) => ({ birthDate }) as unknown as User;

describe('EligibilityNotice', () => {
  it('pede para completar o perfil quando faltam dados', async () => {
    await render(<EligibilityNotice user={user()} />);

    expect(screen.getByText('Vamos completar seu perfil?')).toBeTruthy();
  });

  it('explica a idade mínima para menores de 18 anos', async () => {
    await render(<EligibilityNotice user={user('2015-01-01')} />);

    expect(screen.getByText('Um cuidado para a vida toda')).toBeTruthy();
  });

  it('leva para editar o perfil e de volta ao catálogo', async () => {
    await render(<EligibilityNotice user={user()} />);

    await fireEvent.press(screen.getByText('Editar meu perfil'));
    expect(router.push).toHaveBeenCalledWith('/edit-profile');

    await fireEvent.press(screen.getByText('Voltar ao catálogo'));
    expect(router.replace).toHaveBeenCalledWith('/adopet');
  });
});
