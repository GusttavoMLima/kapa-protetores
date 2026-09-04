import { z } from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Text, View } from 'react-native';
import { SecondaryInputText } from '@/components/inputText/secondary';
import { EnvelopeSimpleIcon, LockIcon } from 'phosphor-react-native';
import { loginFormStyles as styles } from './styles';
import { PrimaryButton } from '@/components/buttons/primary';
import { palette } from '@/theme';
import GoogleSvg from '@/../assets/google.svg';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { control } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.form}>
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
        <Text style={styles.forget}>Esqueceu a senha?</Text>
        <PrimaryButton title="Entrar" />
      </View>

      <View style={styles.horizontalRuleWrapper}>
        <View style={styles.horizontalRule} />
        <Text style={styles.horizontalRuleText}>ou continue com</Text>
        <View style={styles.horizontalRule} />
      </View>

      <PrimaryButton
        title="Google"
        color="#ffffff"
        pressedColor="#f7f7f7"
        textColor="#1C1C19"
        style={{
          borderWidth: 3,
          borderColor: '#E5E2DD',
        }}
        icon={<GoogleSvg width={24} height={24} />}
      />

      <Text style={styles.signUpText}>
        Não tenho uma conta?{' '}
        <Text style={{ color: palette.orange }}>Cadastre-se</Text>
      </Text>
    </View>
  );
}
