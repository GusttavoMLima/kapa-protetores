import { Text, View } from 'react-native';

interface NoticeProps {
  message: string;
  error?: boolean;
}

/**
 * Mensagem padrão de resultado de uma ação (erro ou sucesso).
 * Erros de validação de campo ficam abaixo do próprio campo; falhas de
 * carregamento usam `ErrorState`, que oferece "Tentar novamente".
 */
export function Notice({ message, error = false }: NoticeProps) {
  return (
    <View className={`p-4 rounded-lg ${error ? 'bg-danger-soft' : 'bg-success-soft'}`}>
      <Text
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        className={`font-body text-sm ${error ? 'text-danger' : 'text-success'}`}
      >
        {message}
      </Text>
    </View>
  );
}
