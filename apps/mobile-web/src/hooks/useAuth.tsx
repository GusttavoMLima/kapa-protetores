import { AuthContext } from '@/contexts/authProvider';
import { useContext } from 'react';

export function useAuth() {
  const context = useContext(AuthContext);

  return context;
}
