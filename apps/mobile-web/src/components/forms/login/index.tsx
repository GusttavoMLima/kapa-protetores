import { z } from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Text, View } from 'react-native';
import { SecondaryInputText } from '@/components/inputText/secondary';
import { EnvelopeSimpleIcon, LockIcon } from 'phosphor-react-native';
import { PrimaryButton } from '@/components/buttons/primary';
import { GoogleAuthButton } from '@/components/buttons/google';
import { ErrorBanner } from '@/components/feedback/ErrorBanner';
import { useAuth } from '@/hooks/useAuth';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { router } from 'expo-router';
import { useState } from 'react';

const loginSchema = z.object({
  email: z.string().email('Formato de e-mail inválido'),
  password: z.string().min(1, 'A senha é obrigatória'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { signIn } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    isGoogleReady,
    signInWithGoogle,
    googleErrorMessage,
    clearGoogleError,
  } = useGoogleAuth();

  const { control, handleSubmit, formState } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setErrorMessage(null);
      clearGoogleError();
      await signIn(data.email, data.password);
    } catch (err: unknown) {
      const axiosError = err as {
        response?: {
          data?: {
            message?: string;
            error?: string;
          };
        };
      };
      setErrorMessage(
        axiosError?.response?.data?.message ||
          axiosError?.response?.data?.error ||
          'E-mail ou senha incorretos. Verifique suas credenciais.',
      );
    }
  };

  const handleGooglePress = async () => {
    setErrorMessage(null);
    await signInWithGoogle();
  };

  const activeError = errorMessage || googleErrorMessage;

  return (
    <View className="px-4">
      <View className="flex flex-col items-center gap-5 w-full">
        <ErrorBanner message={activeError} />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <SecondaryInputText
              label="Email"
              icon={<EnvelopeSimpleIcon size={28} color="#57423B50" />}
              value={value}
              onChangeText={onChange}
              placeholder="kapa@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <SecondaryInputText
              label="Senha"
              icon={<LockIcon size={28} color="#57423B50" />}
              value={value}
              onChangeText={onChange}
              placeholder="Digite sua senha"
              isPassword
              error={error?.message}
            />
          )}
        />

        <Text className="w-full text-sm font-semibold text-right text-orange cursor-pointer">
          Esqueceu a senha?
        </Text>

        <PrimaryButton
          title="Entrar"
          className="mt-1"
          loading={formState.isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />
      </View>

      <GoogleAuthButton
        dividerText="ou continue com"
        onPress={handleGooglePress}
        disabled={!isGoogleReady}
      />

      <Text className="text-center my-6 text-sm text-ink-muted">
        Não tenho uma conta?{' '}
        <Text
          className="text-orange font-bold cursor-pointer"
          onPress={() => router.push('/signUp')}
        >
          Cadastre-se
        </Text>
      </Text>
    </View>
  );
}
