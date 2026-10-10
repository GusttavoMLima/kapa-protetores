import '@/../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { AuthProvider } from '@/contexts/authProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              if (isAxiosError(error) && error.response) {
                const status = error.response.status;
                if (status === 401 || status === 403 || status === 404) {
                  return false;
                }
              }
              return failureCount < 2;
            },
          },
        },
      }),
  );
  const [loaded, error] = useFonts({
    'BeVietnamPro-Bold': require('../assets/fonts/BeVietnamPro-Bold.ttf'),
    'BeVietnamPro-ExtraBold': require('../assets/fonts/BeVietnamPro-ExtraBold.ttf'),
    'BeVietnamPro-Medium': require('../assets/fonts/BeVietnamPro-Medium.ttf'),
    'BeVietnamPro-Regular': require('../assets/fonts/BeVietnamPro-Regular.ttf'),

    'PlusJakartaSans-Light': require('../assets/fonts/PlusJakartaSans-Light.ttf'),
    'PlusJakartaSans-Medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'PlusJakartaSans-Regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <View className="flex-1 bg-cream">
            <StatusBar style="light" />

            <Stack>
              <Stack.Screen
                name="(protected)"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="oauthredirect"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="signIn"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="signUp"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="cadastro-animal"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="cadastro-voluntario"
                options={{
                  headerShown: false,
                }}
              />

              <Stack.Screen
                name="cadastro-usuario"
                options={{
                  headerShown: false,
                }}
              />
            </Stack>
          </View>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
