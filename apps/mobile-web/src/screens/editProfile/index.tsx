import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import {
  ArrowLeftIcon,
  CaretRightIcon,
  CheckCircleIcon,
  PawPrintIcon,
  UserIcon,
} from 'phosphor-react-native';
import { router } from 'expo-router';
import { palette } from '@/theme';
import { useAuth } from '@/hooks/useAuth';
import { FotoPicker } from '@/components/photoPicker/profile';
import { PrimaryInputText } from '@/components/inputText/primary';
import { PrimaryButton } from '@/components/buttons/primary';
import { ErrorBanner } from '@/components/feedback/ErrorBanner';
import {
  updateUserProfile,
  uploadUserAvatar,
} from '@/services/userService';
import { useQueryClient } from '@tanstack/react-query';
import { ageFromBirthDate, isValidPhone } from '@kapa/shared';
import { DateTimeField } from '@/components/inputDateTime';

export function EditProfileScreen() {
  const { user, updateUserData } = useAuth();
  const queryClient = useQueryClient();

  const [username, setUsername] = useState<string>(user?.username ?? '');
  const [email, setEmail] = useState<string>(user?.email ?? '');
  const [birthDate, setBirthDate] = useState(user?.birthDate ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [personalDataError, setPersonalDataError] = useState<string>();
  const [avatarUri, setAvatarUri] = useState<string | undefined>(
    user?.avatar ?? undefined,
  );

  const [nameError, setNameError] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleReturnToProfile = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(protected)/(tabs)/profile');
    }
  };

  const validate = (): boolean => {
    let isValid = true;
    setNameError(undefined);
    setEmailError(undefined);
    setErrorMessage(null);
    setPersonalDataError(undefined);
    if (ageFromBirthDate(birthDate) === null || !isValidPhone(phone)) {
      setPersonalDataError('Informe uma data de nascimento válida e um celular com DDD.');
      isValid = false;
    }

    const trimmedName = username.trim();
    if (!trimmedName || trimmedName.length < 3) {
      setNameError('Nome deve ter no mínimo 3 caracteres');
      isValid = false;
    } else if (trimmedName.length > 50) {
      setNameError('Nome deve ter no máximo 50 caracteres');
      isValid = false;
    }

    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      setEmailError('E-mail é obrigatório');
      isValid = false;
    } else if (!emailRegex.test(trimmedEmail)) {
      setEmailError('Formato de e-mail inválido');
      isValid = false;
    }

    return isValid;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      setIsSaving(true);
      setErrorMessage(null);
      setSuccessMessage(null);

      let finalAvatarUrl = avatarUri;

      if (avatarUri && !avatarUri.startsWith('http')) {
        // Upload photo picked from camera / gallery
        finalAvatarUrl = await uploadUserAvatar(avatarUri);
      }

      const updatedUser = await updateUserProfile({
        birthDate,
        phone: phone.replace(/\D/g, ''),
        username: username.trim(),
        email: email.trim().toLowerCase(),
        avatar: finalAvatarUrl ?? null,
      });

      await updateUserData(updatedUser);
      await queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
      setSuccessMessage('Perfil atualizado com sucesso!');
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Não foi possível salvar as alterações. Tente novamente.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-cream"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        padding: 16,
        paddingBottom: 48,
        gap: 20,
      }}
    >
      <View className="flex-row items-center justify-between pt-2">
        <Pressable
          onPress={handleReturnToProfile}
          accessibilityRole="button"
          accessibilityLabel="Voltar para a tela anterior"
          hitSlop={12}
          className="flex-row items-center gap-2 p-2 -ml-2 rounded-full active:bg-orange-100"
        >
          <ArrowLeftIcon size={24} color={palette.ink} weight="bold" />
          <Text className="font-heading font-bold text-ink text-base">
            Voltar
          </Text>
        </Pressable>

        <View className="flex-row items-center gap-1.5 bg-peach px-3 py-1.5 rounded-full">
          <UserIcon size={16} color={palette.orange} weight="bold" />
          <Text className="font-body text-xs font-semibold text-orange-dark">
            Meu Perfil
          </Text>
        </View>
      </View>

      <View className="gap-1 px-1">
        <Text className="font-heading-bold text-2xl text-ink">
          Editar Perfil
        </Text>
        <Text className="font-body text-sm text-ink-muted">
          Atualize sua foto, nome de exibição e e-mail da sua conta.
        </Text>
      </View>

      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}

      {successMessage ? (
        <View className="flex-row items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl">
          <CheckCircleIcon size={20} color="#059669" weight="fill" />
          <Text className="font-body-medium text-sm text-emerald-800 flex-1">
            {successMessage}
          </Text>
        </View>
      ) : null}

      <View className="items-center py-2">
        <FotoPicker
          uri={avatarUri}
          onChange={(newUri) => {
            setAvatarUri(newUri);
            setSuccessMessage(null);
            setErrorMessage(null);
          }}
          label="Alterar foto de perfil"
          modalTitle="Foto de perfil"
          accessibilityLabel="Alterar foto de perfil"
        />
        <Text className="font-body text-xs text-ink-muted mt-2 text-center">
          Toque para escolher da galeria ou tirar uma nova foto
        </Text>
      </View>

      <View className="gap-4 bg-white p-5 rounded-2xl border border-line shadow-card">
        <Text className="font-heading-medium text-lg text-ink">
          Informações Pessoais
        </Text>

        <PrimaryInputText
          label="Nome completo ou de exibição"
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            setNameError(undefined);
            setSuccessMessage(null);
          }}
          placeholder="Como você quer ser chamado"
          erro={nameError}
          autoCapitalize="words"
        />

        <DateTimeField label="Data de nascimento" value={birthDate} onChange={setBirthDate} mode="date" />
        <PrimaryInputText label="Celular com DDD" value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={20} />
        {personalDataError && <Text accessibilityRole="alert" className="font-body text-sm text-danger">{personalDataError}</Text>}
        <PrimaryInputText
          label="E-mail"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setEmailError(undefined);
            setSuccessMessage(null);
          }}
          placeholder="seuemail@exemplo.com"
          keyboardType="email-address"
          autoCapitalize="none"
          erro={emailError}
        />
      </View>

      {user?.role !== 'admin' && user?.role !== 'protector' ? (
        <Pressable
          onPress={() => router.push('/(protected)/adopter-profile')}
          accessibilityRole="button"
          accessibilityLabel="Editar preferências de adoção"
          className="flex-row items-center justify-between p-4 bg-white rounded-2xl border border-line shadow-card active:bg-cream"
        >
          <View className="flex-row items-center gap-3.5 flex-1 pr-2">
            <View className="w-10 h-10 rounded-full bg-peach items-center justify-center">
              <PawPrintIcon size={22} color={palette.orange} weight="bold" />
            </View>
            <View className="flex-1">
              <Text className="font-heading-medium text-base text-ink">
                Preferências de Adoção
              </Text>
              <Text className="font-body text-xs text-ink-muted">
                Espécie, porte, energia e convivência com outros pets
              </Text>
            </View>
          </View>
          <CaretRightIcon size={20} color={palette.inkMuted} weight="bold" />
        </Pressable>
      ) : null}

      <View className="gap-3 pt-2">
        <PrimaryButton
          title="Salvar Alterações"
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving}
          accessibilityLabel="Salvar alterações do perfil"
        />

        <Pressable
          onPress={handleReturnToProfile}
          accessibilityRole="button"
          accessibilityLabel="Cancelar edição do perfil"
          className="items-center justify-center py-3 rounded-xl border border-border bg-white active:bg-cream"
        >
          <Text className="font-body-medium text-sm text-ink-muted">
            Cancelar
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
