import { z } from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Text, View } from 'react-native';
import { SecondaryInputText } from '@/components/inputText/secondary';
import { EnvelopeSimpleIcon, LockIcon } from 'phosphor-react-native';
import { PrimaryButton } from '@/components/buttons/primary';
import GoogleSvg from '@/../assets/google.svg';

import { useAuth } from '@/hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Informe a senha.'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { signIn } = useAuth();
  const [submitError, setSubmitError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const { control, handleSubmit } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setSubmitError(undefined);
    setSubmitting(true);
    try {
      await signIn(data);
    } catch {
      setSubmitError('E-mail ou senha inválidos.');
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <View className="px-4">
      <View className="flex flex-col items-center gap-5 w-full">
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <SecondaryInputText
              label="Email"
              icon={<EnvelopeSimpleIcon size={28} color="#57423B50" />}
              value={value}
              onChangeText={onChange}
              placeholder="kapa@gmail.com"
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <SecondaryInputText
              label="Senha"
              icon={<LockIcon size={28} color="#57423B50" />}
              value={value}
              onChangeText={onChange}
              placeholder={'•'.repeat(8)}
              isPassword
            />
          )}
        />
        <Text className="w-full text-sm font-semibold text-right text-orange cursor-pointer">
          Esqueceu a senha?
        </Text>
        <PrimaryButton
          title="Entrar"
          className="mt-1"
          loading={submitting}
          onPress={handleSubmit((data) => void onSubmit(data))}
        />
        {submitError ? (
          <Text className="w-full text-sm text-danger" accessibilityRole="alert">
            {submitError}
          </Text>
        ) : null}
      </View>

      <View className="flex-row items-center w-full px-5 my-5">
        <View className="flex-1 h-[1px] bg-border my-3" />
        <Text className="text-sm font-semibold text-ink-muted mx-4">
          ou continue com
        </Text>
        <View className="flex-1 h-[1px] bg-border my-3" />
      </View>

      <PrimaryButton
        title="Google"
        color="#ffffff"
        pressedColor="#f7f7f7"
        textColor="#1C1C19"
        className="border-2 border-border"
        icon={<GoogleSvg width={24} height={24} />}
      />

      <Text className="text-center my-6 text-sm text-ink-muted">
        Não tenho uma conta?{' '}
        <Text className="text-orange font-bold">Cadastre-se</Text>
      </Text>
    </View>
  );
}
