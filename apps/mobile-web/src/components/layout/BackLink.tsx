import { router } from 'expo-router';
import { ArrowLeftIcon } from 'phosphor-react-native';
import { Pressable, Text } from 'react-native';
import { palette } from '@/theme';

interface BackLinkProps {
  label?: string;
  onPress?: () => void;
}

export function BackLink({ label = 'Início', onPress }: BackLinkProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Voltar para ${label}`}
      onPress={onPress ?? (() => router.replace('/(protected)/(tabs)'))}
      className="min-h-12 self-start flex-row items-center gap-2 py-3 pr-4"
    >
      <ArrowLeftIcon size={18} color={palette.denim} />
      <Text className="font-body-medium text-sm text-denim">{label}</Text>
    </Pressable>
  );
}
