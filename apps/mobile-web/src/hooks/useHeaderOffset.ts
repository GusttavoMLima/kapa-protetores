import { useContext } from 'react';
import { HeaderHeightContext } from 'expo-router/react-navigation';

/**
 * Altura do cabeçalho das abas, para o `keyboardVerticalOffset` do
 * `KeyboardAvoidingView` no iOS. Fora de um navegador (ex.: testes) é 0.
 */
export function useHeaderOffset(): number {
  return useContext(HeaderHeightContext) ?? 0;
}
