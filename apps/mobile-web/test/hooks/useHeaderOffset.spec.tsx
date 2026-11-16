import type { ReactNode } from 'react';
import { renderHook } from '@testing-library/react-native';
import { HeaderHeightContext } from 'expo-router/react-navigation';
import { useHeaderOffset } from '../../src/hooks/useHeaderOffset';

describe('useHeaderOffset', () => {
  it('é 0 fora de um navegador com cabeçalho', async () => {
    const { result } = await renderHook(() => useHeaderOffset());

    expect(result.current).toBe(0);
  });

  it('usa a altura do cabeçalho quando existe', async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <HeaderHeightContext.Provider value={92}>{children}</HeaderHeightContext.Provider>
    );
    const { result } = await renderHook(() => useHeaderOffset(), { wrapper });

    expect(result.current).toBe(92);
  });
});
