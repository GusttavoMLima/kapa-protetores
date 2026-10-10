import { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import Logo from '@/../assets/Logo 2.svg';
import { useAuth } from '@/hooks/useAuth';

WebBrowser.maybeCompleteAuthSession();

export default function OAuthRedirectScreen() {
  const { isLogged, isReady } = useAuth();

  useEffect(() => {
    if (isReady && isLogged) {
      router.replace('/(protected)/(tabs)');
      return;
    }

    const timeout = setTimeout(() => {
      if (!isLogged) {
        router.replace('/signIn');
      }
    }, 6000);

    return () => clearTimeout(timeout);
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
