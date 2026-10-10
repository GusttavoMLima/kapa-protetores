import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import {
  GOOGLE_OAUTH_WEB_CHANNEL,
  isGoogleOAuthWebMessage,
} from '@/services/googleOAuthWeb';
import { useAuth } from './useAuth';

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
  const handledTokenRef = useRef<string | undefined>(undefined);

  const redirectUri =
    Platform.OS === 'web'
      ? AuthSession.makeRedirectUri({ path: 'oauthredirect' })
      : 'edu.fatec.kapaprotetores:/oauthredirect';

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    ...googleClientIds,
    redirectUri,
  });

  const completeGoogleLogin = useCallback(
    (authResponse: AuthSession.AuthSessionResult | null) => {
      if (authResponse?.type !== 'success') return;

      const idToken =
        authResponse.params?.id_token ??
        authResponse.authentication?.idToken ??
        authResponse.params?.access_token;

      if (!idToken || handledTokenRef.current === idToken) return;
      handledTokenRef.current = idToken;

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
    },
    [handleGoogleLogin],
  );

  useEffect(() => {
    completeGoogleLogin(response);
  }, [completeGoogleLogin, response]);

  useEffect(() => {
    if (
      Platform.OS !== 'web' ||
      !request ||
      typeof BroadcastChannel === 'undefined'
    ) {
      return;
    }

    const channel = new BroadcastChannel(GOOGLE_OAUTH_WEB_CHANNEL);
    channel.addEventListener('message', (event: MessageEvent<unknown>) => {
      if (!isGoogleOAuthWebMessage(event.data)) return;

      let callbackUrl: URL;
      try {
        callbackUrl = new URL(event.data.url);
      } catch {
        setGoogleError('O Google retornou uma URL de autenticação inválida.');
        return;
      }

      if (
        callbackUrl.origin !== window.location.origin ||
        callbackUrl.pathname !== '/oauthredirect'
      ) {
        setGoogleError(
          'A resposta do Google veio de uma origem de autenticação inválida.',
        );
        return;
      }

      const parsedResponse = request.parseReturnUrl(event.data.url);
      if (parsedResponse.type === 'error') {
        setGoogleError(
          'A resposta do Google não passou pela validação de segurança.',
        );
        return;
      }

      completeGoogleLogin(parsedResponse);
    });

    return () => channel.close();
  }, [completeGoogleLogin, request]);

  const authSessionError =
    response?.type === 'error' ? 'Falha ao autenticar com o Google.' : null;

  const signInWithGoogle = useCallback(async () => {
    setGoogleError(null);
    handledTokenRef.current = undefined;
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
