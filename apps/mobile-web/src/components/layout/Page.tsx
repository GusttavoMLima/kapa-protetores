import type { ReactElement, ReactNode } from 'react';
import { ScrollView, View, type RefreshControlProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BackLink } from './BackLink';

interface PageProps {
  children: ReactNode;
  /** `form` limita a largura para telas de formulário; o padrão é a largura de conteúdo. */
  width?: 'content' | 'form';
  /** Rótulo do botão voltar; `null` oculta o botão (telas raiz das abas). */
  backLabel?: string | null;
  onBack?: () => void;
  /** Puxar para atualizar (mobile). */
  refreshControl?: ReactElement<RefreshControlProps>;
}

const WIDTH_CLASS = {
  content: 'max-w-content',
  form: 'max-w-form',
} as const;

export function Page({
  children,
  width = 'content',
  backLabel = 'Início',
  onBack,
  refreshControl,
}: PageProps) {
  return (
    <SafeAreaView className="flex-1 bg-cream">
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="grow"
        refreshControl={refreshControl}
      >
        <View
          className={`w-full ${WIDTH_CLASS[width]} self-center px-5 md:px-10 pb-10 pt-3 gap-6`}
        >
          {backLabel === null ? null : (
            <BackLink label={backLabel} onPress={onBack} />
          )}
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
