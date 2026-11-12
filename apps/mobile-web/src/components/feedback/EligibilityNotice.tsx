import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { isAdult, type User } from '@kapa/shared';
import { PrimaryButton } from '@/components/buttons/primary';
import { PageHeading } from '@/components/layout/PageHeading';

export function EligibilityNotice({ user }: { user: User | null }) {
  const minor = Boolean(user?.birthDate && !isAdult(user.birthDate));
  return (
    <View className="flex-1 bg-cream p-5 items-center justify-center">
      <View className="w-full max-w-form gap-5">
        <PageHeading title={minor ? 'Um cuidado para a vida toda' : 'Vamos completar seu perfil?'} description={minor ? 'É necessário ter 18 anos completos para solicitar adoção ou se candidatar ao voluntariado. Você pode continuar conhecendo os animais e apoiando a Kapa.' : 'Informe sua data de nascimento e celular em Editar Perfil. Esses dados serão preenchidos automaticamente nas suas fichas.'} />
        <PrimaryButton title="Editar meu perfil" onPress={() => router.push('/(protected)/(adopter)/edit-profile')} />
        <Text className="font-body text-sm text-ink-muted">A idade é calculada a partir da data de nascimento cadastrada.</Text>
        <PrimaryButton title="Voltar ao catálogo" onPress={() => router.replace('/adopet')} />
      </View>
    </View>
  );
}
