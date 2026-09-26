import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { useAuth } from './useAuth';

WebBrowser.maybeCompleteAuthSession();

const unconfiguredClientId = 'not-configured.apps.googleusercontent.com';

const googleClientIds = {
  webClientId:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ||
    unconfiguredClientId,
  androidClientId:
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() ||
    unconfiguredClientId,
  iosClientId:
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ||
    unconfiguredClientId,
};

const isGoogleConfigured = Boolean(
  Platform.select({
    web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim(),
    android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim(),
    ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim(),
    default: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim(),
  }),
);

export function useGoogleAuth() {
  const { handleGoogleLogin } = useAuth();
  const [googleError, setGoogleError] = useState<string | null>(null);

  const [request, response, promptAsync] =
    Google.useIdTokenAuthRequest(googleClientIds);

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
    if (!isGoogleConfigured) {
      setGoogleError(
        'O login com Google ainda não está configurado neste ambiente.',
      );
      return;
    }
    await promptAsync();
  }, [promptAsync]);

  return {
    isGoogleReady: isGoogleConfigured && Boolean(request),
    signInWithGoogle,
    googleErrorMessage: googleError || authSessionError,
    clearGoogleError: () => setGoogleError(null),
  };
}
