import { act, fireEvent, render, waitFor } from '@testing-library/react-native';
import { RegisterForm } from '@/components/forms/register';
import { colors, palette } from '@/theme';

const mockSignUp = jest.fn().mockResolvedValue(undefined);
const mockSignInWithGoogle = jest.fn().mockResolvedValue(undefined);
jest.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ signUp: mockSignUp }) }));
jest.mock('@/hooks/useGoogleAuth', () => ({
  useGoogleAuth: () => ({
    isGoogleReady: true,
    signInWithGoogle: mockSignInWithGoogle,
    clearGoogleError: jest.fn(),
  }),
}));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/../assets/google.svg', () => () => null);
jest.mock('@/components/inputDateTime', () => {
  const { TextInput, Text, View } = jest.requireActual('react-native');
  return { DateTimeField: ({ label, value, onChange, error }: { label: string; value: string; onChange: (value: string) => void; error?: string }) => <View><TextInput accessibilityLabel={label} value={value} onChangeText={onChange} />{error && <Text>{error}</Text>}</View> };
});

describe('RegisterForm dados pessoais', () => {
  beforeEach(() => jest.clearAllMocks());

  it('valida a leitura do aviso no cadastro por e-mail e bloqueia o Google até a confirmação', async () => {
    const screen = await render(<RegisterForm />);
    const notice = screen.getByRole('checkbox', {
      name: 'Li e estou ciente de como o Kapa usa meus dados.',
    });
    const register = screen.getByRole('button', { name: 'Cadastrar' });
    const google = screen.getByRole('button', { name: 'Google' });

    expect(screen.getByText('Privacidade e uso dos seus dados')).toBeTruthy();
    expect(notice).not.toBeChecked();
    expect(register).toBeEnabled();
    expect(screen.getByText('Cadastrar')).toHaveStyle({ color: palette.ink });
    expect(google).toBeDisabled();
    expect(screen.getByText('Confirme a leitura do aviso para criar sua conta.')).toBeTruthy();
    await fireEvent.press(register);
    await fireEvent.press(google);
    expect(await screen.findByText('Marque a caixa do aviso de privacidade.')).toBeTruthy();
    expect(screen.getByText(/Revise os campos para cadastrar: .*Aviso de privacidade/)).toBeTruthy();
    expect(mockSignUp).not.toHaveBeenCalled();
    expect(mockSignInWithGoogle).not.toHaveBeenCalled();

    await fireEvent.press(notice);
    expect(notice).toBeChecked();
    expect(register).toBeEnabled();
    expect(screen.queryByText('Marque a caixa do aviso de privacidade.')).toBeNull();
    await fireEvent.press(google);
    expect(mockSignInWithGoogle).toHaveBeenCalledTimes(1);

    await fireEvent.press(notice);
    expect(register).toBeEnabled();
    expect(google).toBeDisabled();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('aplica contraste aos campos e preserva a borda de erro', async () => {
    const screen = await render(<RegisterForm />);
    const email = screen.getByLabelText('E-mail');

    expect(email).toHaveProp('placeholderTextColor', palette.inkMuted);
    expect(email).toHaveStyle({ borderColor: colors.border });
    expect(screen.getByRole('link', { name: 'Entrar' })).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Cadastrar' }));
    expect(await screen.findByText('Formato de e-mail inválido')).toBeTruthy();
    expect(email).not.toHaveStyle({ borderColor: colors.border });
  });

  it('exige nascimento e celular para cadastrar', async () => {
    const screen = await render(<RegisterForm />);
    await fireEvent.press(screen.getByRole('checkbox'));
    await fireEvent.press(screen.getByText('Cadastrar'));
    await waitFor(() => expect(screen.getByText('Informe uma data de nascimento válida.')).toBeTruthy());
    expect(screen.getByText('Informe um celular válido com DDD.')).toBeTruthy();
    expect(screen.getByText(/Revise os campos para cadastrar: .*Data de nascimento, Celular com DDD/)).toBeTruthy();
    expect(mockSignUp).not.toHaveBeenCalled();
    expect(screen.queryByRole('status', { name: 'Criando sua conta…' })).toBeNull();
  });
  it('envia nascimento e celular normalizado e permite criar conta de menor', async () => {
    const screen = await render(<RegisterForm />);
    await fireEvent.changeText(screen.getByLabelText('Nome de usuário'), 'Ana Souza');
    await fireEvent.changeText(screen.getByLabelText('E-mail'), 'ana@example.com');
    await fireEvent.changeText(screen.getByLabelText('Data de nascimento'), '2015-01-01');
    await fireEvent.changeText(screen.getByLabelText('Celular com DDD'), '(19) 99999-8888');
    await fireEvent.changeText(screen.getByLabelText('Senha'), 'senha-teste-123');
    await fireEvent.changeText(screen.getByLabelText('Confirmar senha'), 'senha-teste-123');
    await fireEvent.press(screen.getByRole('checkbox'));
    await fireEvent.press(screen.getByText('Cadastrar'));
    await waitFor(() => expect(mockSignUp).toHaveBeenCalledWith({ username: 'Ana Souza', email: 'ana@example.com', password: 'senha-teste-123', birthDate: '2015-01-01', phone: '19999998888' }));
  });

  it('exibe o loader durante o envio e mantém os dados preenchidos quando a API falha', async () => {
    let failRequest: () => void = () => { throw new Error('O envio ainda não começou'); };
    mockSignUp.mockImplementationOnce(() => new Promise<void>((_, reject) => {
      failRequest = () => reject(new Error('Falha no envio'));
    }));
    const screen = await render(<RegisterForm />);

    await fireEvent.changeText(screen.getByLabelText('Nome de usuário'), 'Ana Souza');
    await fireEvent.changeText(screen.getByLabelText('E-mail'), 'ana@example.com');
    await fireEvent.changeText(screen.getByLabelText('Data de nascimento'), '2015-01-01');
    await fireEvent.changeText(screen.getByLabelText('Celular com DDD'), '(19) 99999-8888');
    await fireEvent.changeText(screen.getByLabelText('Senha'), 'senha-teste-123');
    await fireEvent.changeText(screen.getByLabelText('Confirmar senha'), 'senha-teste-123');
    await fireEvent.press(screen.getByRole('checkbox'));
    let submission: Promise<void> | undefined;
    await act(async () => {
      submission = fireEvent.press(screen.getByRole('button', { name: 'Cadastrar' }));
    });

    expect(screen.getByRole('status')).toHaveTextContent('Criando sua conta…');
    expect(mockSignUp).toHaveBeenCalledTimes(1);

    await act(async () => {
      failRequest();
      await submission;
    });

    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByText('Não foi possível realizar o cadastro. Tente novamente.')).toBeTruthy();
    expect(screen.getByLabelText('E-mail')).toHaveDisplayValue('ana@example.com');
    expect(screen.getByRole('button', { name: 'Cadastrar' })).toBeEnabled();
  });
});
