import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserPlus } from 'phosphor-react-native';
import { PrimaryButton } from '@/components/buttons/primary';
import { PrimaryInputText } from '@/components/inputText/primary';
import { PrimaryChipGroup } from '@/components/chips/primaryChip';
import { palette } from '@/theme';
import { ApiError, apiRequest } from '@/services/api';
import type { User, UserRole } from '@kapa/shared';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CadastroUsuarioScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacaoSenha, setConfirmacaoSenha] = useState('');
  const [role, setRole] = useState<UserRole>('volunteer');
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<
    { kind: 'success' | 'error'; message: string } | undefined
  >();

  const nomeError = attempted && !nome.trim() ? 'Informe o nome completo.' : undefined;
  const emailError =
    attempted && !emailPattern.test(email.trim())
      ? 'Informe um e-mail válido.'
      : undefined;
  const senhaError =
    attempted && senha.length < 12
      ? 'Use pelo menos 12 caracteres.'
      : undefined;
  const confirmacaoSenhaError =
    attempted && confirmacaoSenha !== senha
      ? 'As senhas precisam ser iguais.'
      : undefined;

  function clearForm() {
    setNome('');
    setEmail('');
    setSenha('');
    setConfirmacaoSenha('');
    setRole('volunteer');
    setAttempted(false);
  }

  async function handleSave() {
    setAttempted(true);
    setFeedback(undefined);
    if (
      !nome.trim() ||
      !emailPattern.test(email.trim()) ||
      senha.length < 12 ||
      confirmacaoSenha !== senha
    ) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }

    setSaving(true);
    try {
      await apiRequest<User>('/auth/users', {
        method: 'POST',
        body: JSON.stringify({
        username: nome.trim(),
        email: email.trim().toLowerCase(),
        password: senha,
        role,
        }),
      });
      const firstName = nome.trim().split(/\s+/)[0];
      clearForm();
      setFeedback({ kind: 'success', message: `Usuário ${firstName} cadastrado com sucesso.` });
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    } catch (error) {
      setFeedback({
        kind: 'error',
        message: error instanceof ApiError
          ? error.message
          : 'Não foi possível conectar à API.',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['left', 'right', 'bottom']}>
      <KeyboardAvoidingView className="flex-1 bg-cream" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerClassName="w-full max-w-form self-center gap-5 px-5 pb-10 pt-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center gap-2 pb-1">
            <View className="mb-1 h-14 w-14 items-center justify-center rounded-full bg-peach">
              <UserPlus size={28} weight="fill" color={palette.orange} />
            </View>
            <Text className="font-heading-bold text-center text-2xl leading-[30px] text-ink">Cadastrar usuário</Text>
            <Text className="max-w-[330px] text-center font-body text-base leading-6 text-ink-muted">Crie uma conta e defina o nível de acesso ao sistema.</Text>
          </View>

          {feedback ? (
            <View
              className={
                feedback.kind === 'error'
                  ? 'rounded-md border border-danger bg-danger-soft p-3.5'
                  : 'rounded-md border border-success bg-[#E8F3EE] p-3.5'
              }
              accessibilityLiveRegion="polite"
            >
              <Text
                className={
                  feedback.kind === 'error'
                    ? 'font-body-medium text-sm leading-5 text-danger'
                    : 'font-body-medium text-sm leading-5 text-success'
                }
              >
                {feedback.message}
              </Text>
            </View>
          ) : null}

          <View className="gap-3.5 rounded-lg border border-line bg-card p-4">
            <Text className="font-heading-medium text-xl leading-7 text-denim">Dados do usuário</Text>
            <PrimaryInputText label="Nome completo" value={nome} onChangeText={setNome} placeholder="Seu nome" erro={nomeError} />
            <PrimaryInputText label="E-mail" value={email} onChangeText={setEmail} placeholder="seu@email.com" keyboardType="email-address" autoCapitalize="none" erro={emailError} />
            <PrimaryInputText label="Senha" value={senha} onChangeText={setSenha} placeholder="Pelo menos 12 caracteres" secureTextEntry erro={senhaError} />
            <PrimaryInputText label="Confirmar senha" value={confirmacaoSenha} onChangeText={setConfirmacaoSenha} placeholder="Repita a senha" secureTextEntry erro={confirmacaoSenhaError} />
            <Text className="font-body-medium text-sm leading-4 text-ink">Perfil de acesso</Text>
            <PrimaryChipGroup
              value={role}
              onChange={setRole}
              options={roleOptions}
            />
          </View>

          <Text className="px-3 text-center font-body text-sm leading-5 text-ink-muted">Somente administradores podem criar contas por esta tela.</Text>
          <PrimaryButton title="Cadastrar usuário" loading={saving} onPress={() => void handleSave()} size="lg" />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const roleOptions: { value: UserRole; label: string }[] = [
  { value: 'adopter', label: 'Adotante' },
  { value: 'protector', label: 'Protetor' },
  { value: 'volunteer', label: 'Voluntário' },
  { value: 'admin', label: 'Administrador' },
];
