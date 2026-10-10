import { useEffect } from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import Logo from '@/../assets/Logo 2.svg';
import { useAuth } from '@/hooks/useAuth';
import {
  GOOGLE_OAUTH_WEB_CHANNEL,
  type GoogleOAuthWebMessage,
} from '@/services/googleOAuthWeb';

export default function OAuthRedirectScreen() {
  const { isLogged, isReady } = useAuth();

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    if (typeof window === 'undefined') return;

    try {
      const completion = WebBrowser.maybeCompleteAuthSession();
      if (completion.type === 'success') return;
    } catch {
      // Alguns navegadores removem window.opener durante o fluxo OAuth.
    }

    if (typeof BroadcastChannel === 'undefined') {
      return;
    }

    const channel = new BroadcastChannel(GOOGLE_OAUTH_WEB_CHANNEL);
    const oauthMessage: GoogleOAuthWebMessage = {
      type: 'google-oauth-result',
      url: window.location.href,
    };
    channel.postMessage(oauthMessage);
    channel.close();

    const closeTimeout = window.setTimeout(() => window.close(), 250);
    return () => window.clearTimeout(closeTimeout);
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' || !isReady) return;

    if (isLogged) {
      router.replace('/(protected)/(tabs)');
      return;
    }

    const redirectTimeout = setTimeout(() => router.replace('/signIn'), 6000);
    return () => clearTimeout(redirectTimeout);
  }, [isLogged, isReady]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView
        edges={['left', 'right', 'bottom']}
        className="flex-1 bg-cream items-center justify-center p-8 gap-6"
      >
        <Logo width={184} height={75} />
        <ActivityIndicator size="large" color="#F18322" className="mt-4" />
        <View className="items-center gap-2">
          <Text className="font-vietnam-bold text-2xl text-ink text-center">
            Autenticando com o Google
          </Text>
          <Text className="font-jakarta-medium text-sm text-ink-muted text-center max-w-[280px]">
            Aguarde um momento enquanto preparamos seu acesso...
          </Text>
        </View>
      </SafeAreaView>
    </>
  );
}
