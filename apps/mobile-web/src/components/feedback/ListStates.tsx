import type { ReactNode } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import type { Icon } from 'phosphor-react-native';
import { MagnifyingGlassIcon } from 'phosphor-react-native';
import { TextButton } from '@/components/buttons/secondary';
import { palette } from '@/theme';
import { Notice } from './Notice';

/** Carregando: indicador e texto anunciado aos leitores de tela. */
export function LoadingState({ message }: { message: string }) {
  return (
    <View className="py-16 items-center gap-4">
      <ActivityIndicator color={palette.denim} />
      <Text accessibilityLiveRegion="polite" className="font-body text-ink-muted text-center">
        {message}
      </Text>
    </View>
  );
}

/** Falha ao carregar: mensagem de erro padrão e sempre "Tentar novamente". */
export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View className="py-6 gap-4">
      <Notice error message={message} />
      <TextButton label="Tentar novamente" onPress={onRetry} />
    </View>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: Icon;
  /** Ação opcional, ex.: "Limpar filtros" quando nenhum resultado foi encontrado. */
  action?: ReactNode;
}

/** Lista vazia ou nenhum resultado encontrado. */
export function EmptyState({ title, description, icon: IconComponent = MagnifyingGlassIcon, action }: EmptyStateProps) {
  return (
    <View className="items-center px-6 py-16 gap-4">
      <View className="p-5 rounded-full bg-peach">
        <IconComponent size={40} color={palette.denim} weight="duotone" />
      </View>
      <Text accessibilityRole="header" className="font-heading-bold text-xl text-ink text-center">
        {title}
      </Text>
      <Text className="font-body text-sm text-ink-muted text-center max-w-form">{description}</Text>
      {action}
    </View>
  );
}
