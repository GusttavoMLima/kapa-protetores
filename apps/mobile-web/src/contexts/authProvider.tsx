import { kapaService } from '@/services/kapaService';
import { genericStorage } from '@/storage/genericStorage';
import { User } from '@kapa/shared';
import { router } from 'expo-router';
import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';

export interface SignUpData {
  username: string;
  email: string;
  password: string;
  avatar?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface AuthContextProps {
  isLogged: boolean;
  isReady: boolean;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => void;
  handleGoogleLogin: (idToken: string) => Promise<void>;
}

const AUTH_STORAGE_TOKEN_KEY = '@kapa:auth-token';
const AUTH_STORAGE_DATA_KEY = '@kapa:user-data';

export const AuthContext = createContext<AuthContextProps>(
  {} as AuthContextProps,
);

interface AuthProviderProp {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProp) {
  const [isLogged, setIsLogged] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  const storageState = async (token: string, data: User) => {
    try {
      await genericStorage.set<string>(AUTH_STORAGE_TOKEN_KEY, token);
      await genericStorage.set<User>(AUTH_STORAGE_DATA_KEY, data);
      kapaService.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (err) {
      console.error('Error on saving auth storage state:', err);
    }
  };

  const establishSession = useCallback(
    async (token: string, userData: User) => {
      await storageState(token, userData);
      setUser(userData);
      setIsLogged(true);
      router.replace('/(protected)/(tabs)');
    },
    [],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await kapaService.post('/api/users/signin', {
          email,
          password,
        });

        if (!response.data?.data) {
          throw new Error('Falha na resposta de autenticação.');
        }

        const { token, user: userData } = response.data.data;
        await establishSession(token, userData);
      } catch (err) {
        console.error('signIn error:', err);
        throw err;
      }
    },
    [establishSession],
  );

  const signUp = useCallback(
    async (data: SignUpData) => {
      try {
        const response = await kapaService.post('/api/users/create', data);

        if (!response.data?.data) {
          throw new Error('Falha no cadastro.');
        }

        const { token, user: userData } = response.data.data;
        await establishSession(token, userData);
      } catch (err) {
        console.error('signUp error:', err);
        throw err;
      }
    },
    [establishSession],
  );

  const signOut = async () => {
    setIsLogged(false);
    setUser(null);
    delete kapaService.defaults.headers.common['Authorization'];
    await genericStorage.remove(AUTH_STORAGE_TOKEN_KEY);
    await genericStorage.remove(AUTH_STORAGE_DATA_KEY);
    router.replace('/signIn');
  };

  const handleGoogleLogin = useCallback(
    async (idToken: string) => {
      try {
        const response = await kapaService.post('/api/auth/google', {
          idToken,
        });

        if (!response.data?.data) {
          throw new Error('Error on authentication.');
        }

        const { token, user: userData } = response.data.data;
        await establishSession(token, userData);
      } catch (err) {
        console.error('handleGoogleLogin error:', err);
        throw err;
      }
    },
    [establishSession],
  );

  useEffect(() => {
    async function loadStorageState() {
      try {
        const storedToken = await genericStorage.get<string>(
          AUTH_STORAGE_TOKEN_KEY,
        );
        const storedUser = await genericStorage.get<User>(
          AUTH_STORAGE_DATA_KEY,
        );

        if (storedToken && storedUser) {
          kapaService.defaults.headers.common['Authorization'] =
            `Bearer ${storedToken}`;
          setUser(storedUser);
          setIsLogged(true);
        } else {
          setIsLogged(false);
          setUser(null);
        }
      } catch (err) {
        console.error('Error loading auth storage state:', err);
        setIsLogged(false);
        setUser(null);
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
        isReady,
        user,
        signIn,
        signUp,
        signOut,
        handleGoogleLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
