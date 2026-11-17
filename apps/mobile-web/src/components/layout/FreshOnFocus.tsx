import { Fragment, type ReactNode } from 'react';
import { useIsFocused, useLocalSearchParams } from 'expo-router';

/**
 * Telas dentro das abas continuam montadas depois que o usuário sai delas.
 * Para formulários e telas por id, isso deixaria dados da visita anterior.
 * Este wrapper desmonta a tela fora de foco e a recria quando os parâmetros
 * mudam (ex.: outro pet), como acontecia na pilha.
 */
export function FreshOnFocus({ children }: { children: ReactNode }) {
  const focused = useIsFocused();
  const params = useLocalSearchParams();

  if (!focused) return null;

  return <Fragment key={JSON.stringify(params)}>{children}</Fragment>;
}
