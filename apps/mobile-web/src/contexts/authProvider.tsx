import { apiRequest, ApiError, setAccessToken } from '@/services/api';
import { kapaService, setOnUnauthorizedCallback } from '@/services/kapaService';
import { genericStorage } from '@/storage/genericStorage';
import { User } from '@kapa/shared';
import { router } from 'expo-router';
import {
  createContext,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
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

export interface AuthContextProps {
  isLogged: boolean;
  isReady: boolean;
  user: User | null;
  hasAdopterProfile: boolean | null;
  isCheckingProfile: boolean;
  checkAdopterProfile: () => Promise<boolean>;
  setHasAdopterProfile: (value: boolean) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => void;
  handleGoogleLogin: (idToken: string) => Promise<void>;
  updateUserData: (updatedUser: User) => Promise<void>;
}

const AUTH_STORAGE_TOKEN_KEY = '@kapa:auth-token';
const AUTH_STORAGE_DATA_KEY = '@kapa:user-data';
const AUTH_STORAGE_PROFILE_KEY = '@kapa:has-adopter-profile';

function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    const decoded = JSON.parse(jsonPayload) as { exp?: number };
    if (!decoded.exp) return false;
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
}

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
  const [hasAdopterProfile, setHasAdopterProfileState] = useState<boolean | null>(null);
  const [isCheckingProfile, setIsCheckingProfile] = useState<boolean>(false);

  const storageState = async (token: string, data: User) => {
    try {
      await genericStorage.set<string>(AUTH_STORAGE_TOKEN_KEY, token);
      await genericStorage.set<User>(AUTH_STORAGE_DATA_KEY, data);
      kapaService.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setAccessToken(token);
    } catch (err) {
      console.error('Error on saving auth storage state:', err);
    }
  };

  const setHasAdopterProfile = useCallback(async (value: boolean) => {
    setHasAdopterProfileState(value);
    await genericStorage.set<boolean>(AUTH_STORAGE_PROFILE_KEY, value);
  }, []);

  const checkAdopterProfile = useCallback(async (): Promise<boolean> => {
    setIsCheckingProfile(true);
    try {
      await apiRequest('/adopter-profiles/me');
      setHasAdopterProfileState(true);
      await genericStorage.set<boolean>(AUTH_STORAGE_PROFILE_KEY, true);
      return true;
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setHasAdopterProfileState(false);
        await genericStorage.set<boolean>(AUTH_STORAGE_PROFILE_KEY, false);
        return false;
      }
      return false;
    } finally {
      setIsCheckingProfile(false);
    }
  }, []);

  const establishSession = useCallback(
    async (token: string, userData: User) => {
      await storageState(token, userData);
      setUser(userData);
      setIsLogged(true);

      if (userData.role === 'adopter') {
        const hasProfile = await checkAdopterProfile();
        if (!hasProfile) {
          router.replace('/(protected)/adopter-profile');
          return;
        }
      }

      router.replace('/(protected)/(tabs)');
    },
    [checkAdopterProfile],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await kapaService.post('/auth/login', {
          email,
          password,
        });

        if (!response.data?.data) {
          throw new Error('Falha na resposta de autenticação.');
        }

        const { token, user: userData } = response.data.data;
        await establishSession(token, userData);
      } catch (err) {
        throw err;
      }
    },
    [establishSession],
  );

  const signUp = useCallback(
    async (data: SignUpData) => {
      try {
        const response = await kapaService.post('/users/create', data);

        if (!response.data?.data) {
          throw new Error('Falha no cadastro.');
        }

        const { token, user: userData } = response.data.data;
        await establishSession(token, userData);
      } catch (err) {
        throw err;
      }
    },
    [establishSession],
  );

  const signOut = useCallback(async () => {
    setIsLogged(false);
    setUser(null);
    setHasAdopterProfileState(null);
    setAccessToken(undefined);
    delete kapaService.defaults.headers.common['Authorization'];
    await genericStorage.remove(AUTH_STORAGE_TOKEN_KEY);
    await genericStorage.remove(AUTH_STORAGE_DATA_KEY);
    await genericStorage.remove(AUTH_STORAGE_PROFILE_KEY);
    router.replace('/signIn');
  }, []);

  const handleGoogleLogin = useCallback(
    async (idToken: string) => {
      try {
        const response = await kapaService.post('/auth/google', {
          idToken,
        });

        if (!response.data?.data) {
          throw new Error('Error on authentication.');
        }

        const { token, user: userData } = response.data.data;
        await establishSession(token, userData);
      } catch (err) {
        throw err;
      }
    },
    [establishSession],
  );

  useEffect(() => {
    setOnUnauthorizedCallback(() => {
      void signOut();
    });
    return () => {
      setOnUnauthorizedCallback(null);
    };
  }, [signOut]);

  useEffect(() => {
    async function loadStorageState() {
      try {
        const storedToken = await genericStorage.get<string>(
          AUTH_STORAGE_TOKEN_KEY,
        );
        const storedUser = await genericStorage.get<User>(
          AUTH_STORAGE_DATA_KEY,
        );
        const storedProfileStatus = await genericStorage.get<boolean>(
          AUTH_STORAGE_PROFILE_KEY,
        );

        if (storedToken && storedUser) {
          if (isTokenExpired(storedToken)) {
            await genericStorage.remove(AUTH_STORAGE_TOKEN_KEY);
            await genericStorage.remove(AUTH_STORAGE_DATA_KEY);
            await genericStorage.remove(AUTH_STORAGE_PROFILE_KEY);
            delete kapaService.defaults.headers.common['Authorization'];
            setAccessToken(undefined);
            setIsLogged(false);
            setUser(null);
            setHasAdopterProfileState(null);
          } else {
            kapaService.defaults.headers.common['Authorization'] =
              `Bearer ${storedToken}`;
            setAccessToken(storedToken);
            setUser(storedUser);
            setIsLogged(true);

            if (storedProfileStatus !== null && storedProfileStatus !== undefined) {
              setHasAdopterProfileState(storedProfileStatus);
            }

            if (storedUser.role === 'adopter' && storedProfileStatus !== true) {
              void checkAdopterProfile();
            }
          }
        } else {
          setIsLogged(false);
          setUser(null);
          setHasAdopterProfileState(null);
        }
      } catch (err) {
        console.error('Error loading auth storage state:', err);
        setIsLogged(false);
        setUser(null);
        setHasAdopterProfileState(null);
      } finally {
        setIsReady(true);
      }
    }

    loadStorageState();
  }, [checkAdopterProfile]);

  const updateUserData = useCallback(async (updatedUser: User) => {
    setUser(updatedUser);
    await genericStorage.set<User>(AUTH_STORAGE_DATA_KEY, updatedUser);
  }, []);

  const contextValue = useMemo(
    () => ({
      isLogged,
      isReady,
      user,
      hasAdopterProfile,
      isCheckingProfile,
      checkAdopterProfile,
      setHasAdopterProfile,
      signIn,
      signUp,
      signOut,
      handleGoogleLogin,
      updateUserData,
    }),
    [
      isLogged,
      isReady,
      user,
      hasAdopterProfile,
      isCheckingProfile,
      checkAdopterProfile,
      setHasAdopterProfile,
      signIn,
      signUp,
      signOut,
      handleGoogleLogin,
      updateUserData,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}
