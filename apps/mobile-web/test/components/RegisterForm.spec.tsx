import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { RegisterForm } from '@/components/forms/register';

const mockSignUp = jest.fn().mockResolvedValue(undefined);
jest.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ signUp: mockSignUp }) }));
jest.mock('@/hooks/useGoogleAuth', () => ({ useGoogleAuth: () => ({ isGoogleReady: false, clearGoogleError: jest.fn() }) }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/components/buttons/google', () => ({ GoogleAuthButton: () => null }));
jest.mock('@/components/inputDateTime', () => {
  const { TextInput, Text, View } = jest.requireActual('react-native');
  return { DateTimeField: ({ label, value, onChange, error }: { label: string; value: string; onChange: (value: string) => void; error?: string }) => <View><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} />{error && <Text>{error}</Text>}</View> };
});

describe('RegisterForm dados pessoais', () => {
  beforeEach(() => mockSignUp.mockClear());
  it('exige nascimento e celular para cadastrar', async () => {
    const screen = await render(<RegisterForm />);
    await fireEvent.press(screen.getByText('Cadastrar'));
    await waitFor(() => expect(screen.getByText('Informe uma data de nascimento válida.')).toBeTruthy());
    expect(screen.getByText('Informe um celular válido com DDD.')).toBeTruthy();
    expect(mockSignUp).not.toHaveBeenCalled();
  });
  it('envia nascimento e celular normalizado e permite criar conta de menor', async () => {
    const screen = await render(<RegisterForm />);
    await fireEvent.changeText(screen.getByLabelText('Nome de usuário'), 'Ana Souza');
    await fireEvent.changeText(screen.getByLabelText('E-mail'), 'ana@example.com');
    await fireEvent.changeText(screen.getByLabelText('Data de nascimento'), '2015-01-01');
    await fireEvent.changeText(screen.getByLabelText('Celular com DDD'), '(19) 99999-8888');
    await fireEvent.changeText(screen.getByLabelText('Senha'), 'senha-teste-123');
    await fireEvent.changeText(screen.getByLabelText('Confirmar senha'), 'senha-teste-123');
    await fireEvent.press(screen.getByText('Cadastrar'));
    await waitFor(() => expect(mockSignUp).toHaveBeenCalledWith({ username: 'Ana Souza', email: 'ana@example.com', password: 'senha-teste-123', birthDate: '2015-01-01', phone: '19999998888' }));
  });
});
