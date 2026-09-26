import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';

WebBrowser.maybeCompleteAuthSession();

export function useGoogleAuth() {
  const { handleGoogleLogin } = useAuth();
  const [googleError, setGoogleError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const idToken =
        response.params?.id_token ??
        response.authentication?.idToken ??
        response.params?.access_token;

      if (idToken) {
        handleGoogleLogin(idToken).catch((err: unknown) => {
          const axiosError = err as {
            response?: {
              data?: {
                message?: string;
                error?: string;
              };
            };
          };
          setGoogleError(
            axiosError?.response?.data?.message ||
              axiosError?.response?.data?.error ||
              'Falha na autenticação com o Google.',
          );
        });
      }
    }
  }, [response, handleGoogleLogin]);

  const authSessionError =
    response?.type === 'error' ? 'Falha ao autenticar com o Google.' : null;

  const signInWithGoogle = useCallback(async () => {
    setGoogleError(null);
    await promptAsync();
  }, [promptAsync]);

  return {
    isGoogleReady: Boolean(request),
    signInWithGoogle,
    googleErrorMessage: googleError || authSessionError,
    clearGoogleError: () => setGoogleError(null),
  };
}
