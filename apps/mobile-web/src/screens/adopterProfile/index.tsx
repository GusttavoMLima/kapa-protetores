import { AdopterProfileForms } from '@/components/forms/adopterProfile';
import { AdopterProfileFormDataType } from '@/components/forms/adopterProfile/model';
import {
  useAdopterProfile,
  useAdopterProfileMe,
} from '@/hooks/useAdopterProfile';
import { useAuth } from '@/hooks/useAuth';
import { palette } from '@/theme';
import { router } from 'expo-router';
import { ArrowLeftIcon } from 'phosphor-react-native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

export function AdopterProfileScreen() {
  const [current, setCurrent] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const mutation = useAdopterProfile();
  const { data: savedProfile } = useAdopterProfileMe();
  const { signOut, hasAdopterProfile } = useAuth();

  const initialValues = useMemo<Partial<AdopterProfileFormDataType> | undefined>(() => {
    if (!savedProfile) return undefined;
    return {
      preferredSpecies: savedProfile.preferredSpecies ?? null,
      preferredGender: savedProfile.preferredGender ?? null,
      preferredSize: savedProfile.preferredSize ?? null,
      preferredEnergy: savedProfile.preferredEnergy ?? null,
      preferredKidFriendly: savedProfile.preferredKidFriendly ?? null,
      preferredNoise: savedProfile.preferredNoise ?? null,
      preferredAgeStage: savedProfile.preferredAgeStage ?? null,
      livesInApartment: savedProfile.livesInApartment ?? null,
      hasOtherPets: savedProfile.hasOtherPets ?? null,
    };
  }, [savedProfile]);

  const handleNext = () => {
    setError(null);
    setCurrent((prev) => prev + 1);
  };

  const submit = (data: AdopterProfileFormDataType) => {
    setError(null);
    mutation.mutate(data, {
      onSuccess: () => {
        handleNext();
      },
      onError: (err) => {
        setError(
          err instanceof Error
            ? err.message
            : 'Não foi possível salvar o perfil. Tente novamente.',
        );
      },
    });
  };

  const handleBack = () => {
    setError(null);
    setCurrent((prev) => Math.max(0, prev - 1));
  };

  const handleExitToApp = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(protected)/(tabs)');
  };

  return (
    <ScrollView
      className="flex-1 bg-cream"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        padding: 16,
        paddingBottom: 48,
        gap: 20,
        minHeight: '100%',
      }}
    >
      <View className="flex-row justify-between items-center px-1 pt-2">
        <View className="flex-row items-center gap-3">
          {hasAdopterProfile ? (
            <Pressable
              onPress={handleExitToApp}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
              hitSlop={8}
              className="flex-row items-center gap-1.5 py-1.5 pr-2"
            >
              <ArrowLeftIcon size={18} color={palette.denim} />
              <Text className="font-body-medium text-sm text-denim">Voltar</Text>
            </Pressable>
          ) : null}
          <Text className="font-heading-bold text-xl text-ink">
            Perfil de Adoção
          </Text>
        </View>
        <Pressable
          onPress={signOut}
          accessibilityRole="button"
          accessibilityLabel="Sair da conta"
          hitSlop={8}
          className="px-3 py-1.5 rounded-lg active:bg-cream-dark"
        >
          <Text className="font-body-medium text-sm text-ink-muted">Sair</Text>
        </Pressable>
      </View>

      {error ? (
        <View className="p-3 bg-red-100 border border-danger rounded-xl">
          <Text className="font-body-medium text-xs text-danger text-center">
            {error}
          </Text>
        </View>
      ) : null}

      <AdopterProfileForms
        currentField={current}
        onSubmit={submit}
        onBack={current > 0 ? handleBack : undefined}
        onNext={handleNext}
        initialValues={initialValues}
        isSubmitting={mutation.isPending}
        onComplete={handleExitToApp}
      />
    </ScrollView>
  );
}
