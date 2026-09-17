import { genericStorage } from '@/storage/genericStorage';
import { router } from 'expo-router';
import { createContext, ReactNode, useEffect, useState } from 'react';

interface AuthContextProps {
  isLogged: boolean;
  isReady: boolean;
  signIn: () => void;
  signOut: () => void;
}

const AUTH_STORAGE_KEY = '@kapa:auth-state';

export const AuthContext = createContext<AuthContextProps>(
  {} as AuthContextProps,
);

interface AuthProviderProp {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProp) {
  const [isLogged, setIsLogged] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);

  const storageState = async (newState: boolean) => {
    try {
      await genericStorage.set<boolean>(AUTH_STORAGE_KEY, newState);
    } catch (err) {
      console.error(err);
    }
  };

  const signIn = () => {
    setIsLogged(true);
    storageState(true);
    router.replace('/');
  };

  const signOut = () => {
    setIsLogged(false);
    storageState(false);
    router.replace('/signIn');
  };

  useEffect(() => {
    async function loadStorageState() {
      try {
        const storagedState =
          await genericStorage.get<boolean>(AUTH_STORAGE_KEY);

        setIsLogged(storagedState ?? false);
      } catch (err) {
        console.error(err);
        setIsLogged(false);
      } finally {
        setIsReady(true);
      }
    }

    loadStorageState();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLogged,
        signIn,
        signOut,
        isReady,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
