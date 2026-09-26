import type { ReactNode } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { PawPrintIcon, ArrowLeftIcon } from 'phosphor-react-native';
import { router, Redirect } from 'expo-router';
import { canManageAnimals, type Animal, type AnimalStatus } from '@kapa/shared';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { palette } from '@/theme';
import { statusLabel } from './model';

export function AnimalAccess({ children }: { children: ReactNode }) {
  const { user, isReady, isLogged } = useAuth();
  if (!isReady) return <View className="flex-1 items-center justify-center bg-cream"><ActivityIndicator accessibilityLabel="Carregando sessão" color={palette.denim} /></View>;
  if (!isLogged) return <Redirect href="/signIn" />;
  if (!canManageAnimals(user?.role)) return <View className="flex-1 justify-center items-center bg-cream p-5 gap-4">
    <Text accessibilityRole="header" className="font-heading-bold text-xl text-ink">Área da equipe do abrigo</Text>
    <Text className="font-body text-center text-ink-muted">Seu perfil não tem permissão para gerenciar animais.</Text>
    <TextButton label="Voltar ao início" onPress={() => router.replace('/(protected)/(tabs)')} />
  </View>;
  return children;
}

export function TextButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled}
    onPress={onPress} className={`min-h-12 px-4 py-3 rounded-md items-center justify-center border border-border ${disabled ? 'opacity-40' : 'hover:bg-peach active:bg-peach'}`}>
    <Text className="font-body-medium text-sm text-denim">{label}</Text>
  </Pressable>;
}

export function BackLink({ label = 'Início', onPress }: { label?: string; onPress?: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={`Voltar para ${label}`} onPress={onPress ?? (() => router.replace('/(protected)/(tabs)'))}
    className="min-h-12 self-start flex-row items-center gap-2 py-3 pr-4">
    <ArrowLeftIcon size={18} color={palette.denim} /><Text className="font-body-medium text-sm text-denim">{label}</Text>
  </Pressable>;
}

export function StatusBadge({ status }: { status: AnimalStatus }) {
  const tone = status === 'available' ? 'bg-success-soft text-success' : status === 'treating'
    ? 'bg-peach text-ink-muted' : status === 'adopted' ? 'bg-cream-dark text-denim' : 'bg-cream text-ink-muted';
  return <Text className={`self-start rounded-full px-3 py-2 font-body-medium text-xs ${tone}`}>{statusLabel[status]}</Text>;
}

export function AnimalThumbnail({ animal }: { animal: Animal }) {
  const [failed, setFailed] = useState(false);
  const uri = animal.photos?.[0]?.photoUrl;
  return <View className="w-16 h-16 rounded-lg bg-peach items-center justify-center overflow-hidden">
    {uri && !failed ? <Image source={{ uri }} onError={() => setFailed(true)} accessibilityLabel={`Foto de ${animal.name}`} className="w-full h-full" resizeMode="cover" />
      : <PawPrintIcon size={28} weight="duotone" color={palette.denim} />}
  </View>;
}

export function ChoiceGroup<T extends string | number | boolean>({ label, options, value, onChange, disabled = false }: {
  label: string; options: readonly { value: T; label: string }[]; value: T; onChange: (value: T) => void; disabled?: boolean;
}) {
  return <View className="gap-2">
    <Text className="font-body-medium text-sm text-ink">{label}</Text>
    <View accessibilityRole="radiogroup" accessibilityLabel={label} className="flex-row flex-wrap gap-2">
      {options.map((option) => <Pressable key={String(option.value)} onPress={() => onChange(option.value)} disabled={disabled}
        accessibilityRole="radio" accessibilityLabel={option.label} aria-checked={value === option.value} accessibilityState={{ checked: value === option.value, disabled }}
        className={`min-h-12 px-4 py-3 rounded-full border justify-center ${value === option.value ? 'bg-denim border-denim' : 'bg-white border-border hover:bg-cream'}`}>
        <Text className={`font-body-medium text-sm ${value === option.value ? 'text-white' : 'text-ink-muted'}`}>{option.label}</Text>
      </Pressable>)}
    </View>
  </View>;
}

export function Notice({ message, error = false }: { message: string; error?: boolean }) {
  return <View className={`p-4 rounded-lg ${error ? 'bg-danger-soft' : 'bg-success-soft'}`}>
    <Text accessibilityRole="alert" accessibilityLiveRegion="polite" className={`font-body text-sm ${error ? 'text-danger' : 'text-success'}`}>{message}</Text>
  </View>;
}
