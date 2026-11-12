import { z } from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Text, View } from 'react-native';
import { SecondaryInputText } from '@/components/inputText/secondary';
import { EnvelopeSimpleIcon, LockIcon, UserIcon } from 'phosphor-react-native';
import { PrimaryButton } from '@/components/buttons/primary';
import { GoogleAuthButton } from '@/components/buttons/google';
import { ErrorBanner } from '@/components/feedback/ErrorBanner';
import { useAuth } from '@/hooks/useAuth';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { router } from 'expo-router';
import { useState } from 'react';
import { ageFromBirthDate, isValidPhone } from '@kapa/shared';
import { DateTimeField } from '@/components/inputDateTime';

const registerFormSchema = z
  .object({
    birthDate: z.string().refine((value) => ageFromBirthDate(value) !== null, 'Informe uma data de nascimento válida.'),
    phone: z.string().max(20).refine(isValidPhone, 'Informe um celular válido com DDD.'),
    username: z
      .string({ required_error: 'Nome de usuário é obrigatório' })
      .trim()
      .min(3, 'Nome de usuário deve ter no mínimo 3 caracteres')
      .max(50, 'Nome de usuário muito longo'),
    email: z
      .string({ required_error: 'E-mail é obrigatório' })
      .trim()
      .toLowerCase()
      .email('Formato de e-mail inválido'),
    password: z
      .string({ required_error: 'Senha é obrigatória' })
      .min(6, 'A senha deve ter no mínimo 6 caracteres')
      .max(128, 'A senha deve ter no máximo 128 caracteres'),
    confirmPassword: z
      .string({ required_error: 'Confirmação de senha é obrigatória' })
      .min(1, 'Confirme sua senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerFormSchema>;

export function RegisterForm() {
  const { signUp } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    isGoogleReady,
    signInWithGoogle,
    googleErrorMessage,
    clearGoogleError,
  } = useGoogleAuth();

  const { control, handleSubmit, formState } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      birthDate: '',
      phone: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setErrorMessage(null);
      clearGoogleError();
      await signUp({
        birthDate: data.birthDate,
        phone: data.phone.replace(/\D/g, ''),
        username: data.username,
        email: data.email,
        password: data.password,
      });
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
          'Não foi possível realizar o cadastro. Tente novamente.',
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
          name="username"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <SecondaryInputText
              label="Nome de usuário"
              icon={<UserIcon size={28} color="#57423B50" />}
              value={value}
              onChangeText={onChange}
              placeholder="Ex: Danilo Alves"
              autoCapitalize="words"
              error={error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <SecondaryInputText
              label="E-mail"
              icon={<EnvelopeSimpleIcon size={28} color="#57423B50" />}
              value={value}
              onChangeText={onChange}
              placeholder="seu.email@kapa.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={error?.message}
            />
          )}
        />

        <Controller control={control} name="birthDate" render={({ field: { onChange, value }, fieldState: { error } }) => (
          <DateTimeField label="Data de nascimento" value={value} onChange={onChange} mode="date" error={error?.message} containerStyle={{ width: '100%' }} />
        )} />
        <Controller control={control} name="phone" render={({ field: { onChange, value }, fieldState: { error } }) => (
          <SecondaryInputText label="Celular com DDD" value={value} onChangeText={onChange} placeholder="(19) 99999-9999" keyboardType="phone-pad" maxLength={20} error={error?.message} />
        )} />
        <Text className="font-body text-xs text-ink-muted">Adoção e candidatura ao voluntariado são permitidas a partir de 18 anos completos.</Text>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <SecondaryInputText
              label="Senha"
              icon={<LockIcon size={28} color="#57423B50" />}
              value={value}
              onChangeText={onChange}
              placeholder="Mínimo 6 caracteres"
              isPassword
              error={error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, value }, fieldState: { error } }) => (
            <SecondaryInputText
              label="Confirmar senha"
              icon={<LockIcon size={28} color="#57423B50" />}
              value={value}
              onChangeText={onChange}
              placeholder="Repita sua senha"
              isPassword
              error={error?.message}
            />
          )}
        />

        <PrimaryButton
          title="Cadastrar"
          className="mt-2"
          loading={formState.isSubmitting}
          onPress={handleSubmit(onSubmit)}
        />
      </View>

      <GoogleAuthButton
        dividerText="ou cadastre-se com"
        onPress={handleGooglePress}
        disabled={!isGoogleReady}
      />

      <Text className="text-center my-6 text-sm text-ink-muted">
        Já tem uma conta?{' '}
        <Text
          className="text-orange font-bold cursor-pointer"
          onPress={() => router.push('/signIn')}
        >
          Entrar
        </Text>
      </Text>
    </View>
  );
}
