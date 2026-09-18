import { router } from 'expo-router';
import { createContext, ReactNode, useState } from 'react';
import type { AuthResponse, User } from '@kapa/shared';
import { apiRequest, setAccessToken } from '@/services/api';

interface AuthContextProps {
  isLogged: boolean;
  isReady: boolean;
  user?: User;
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  register: (input: {
    username: string;
    email: string;
    password: string;
    role: 'adopter' | 'volunteer';
  }) => Promise<void>;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextProps>(
  {} as AuthContextProps,
);

interface AuthProviderProp {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProp) {
  const [user, setUser] = useState<User>();

  const signIn = async (credentials: { email: string; password: string }) => {
    const auth = await apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    setAccessToken(auth.token);
    setUser(auth.user);
    router.replace('/');
  };

  const signOut = () => {
    setAccessToken(undefined);
    setUser(undefined);
    router.replace('/signIn');
  };

  const register = async (input: {
    username: string;
    email: string;
    password: string;
    role: 'adopter' | 'volunteer';
  }) => {
    const auth = await apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    setAccessToken(auth.token);
    setUser(auth.user);
    router.replace('/');
  };

  return (
    <AuthContext.Provider
      value={{
        isLogged: Boolean(user),
        isReady: true,
        user,
        signIn,
        register,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
