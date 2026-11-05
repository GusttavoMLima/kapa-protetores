import '@/../global.css';
import { AnimatedSplashOverlay } from '@/components/splash/AnimatedSplashOverlay';
import { AuthProvider } from '@/contexts/authProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

const NON_RETRYABLE_HTTP_STATUSES = new Set([401, 403, 404]);
const MAX_QUERY_RETRIES = 2;

function createAppQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (isAxiosError(error) && error.response) {
            if (NON_RETRYABLE_HTTP_STATUSES.has(error.response.status)) {
              return false;
            }
          }
          return failureCount < MAX_QUERY_RETRIES;
        },
      },
    },
  });
}

export default function RootLayout() {
  const [queryClient] = useState(createAppQueryClient);
  const [isSplashAnimationComplete, setIsSplashAnimationComplete] =
    useState(false);

  const [loaded, error] = useFonts({
    'BeVietnamPro-Bold': require('../assets/fonts/BeVietnamPro-Bold.ttf'),
    'BeVietnamPro-ExtraBold': require('../assets/fonts/BeVietnamPro-ExtraBold.ttf'),
    'BeVietnamPro-Medium': require('../assets/fonts/BeVietnamPro-Medium.ttf'),
    'BeVietnamPro-Regular': require('../assets/fonts/BeVietnamPro-Regular.ttf'),

    'PlusJakartaSans-Light': require('../assets/fonts/PlusJakartaSans-Light.ttf'),
    'PlusJakartaSans-Medium': require('../assets/fonts/PlusJakartaSans-Medium.ttf'),
    'PlusJakartaSans-Regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
  });

  const handleSplashAnimationComplete = useCallback(() => {
    setIsSplashAnimationComplete(true);
  }, []);

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

            {/* {!isSplashAnimationComplete && (
              <AnimatedSplashOverlay
                onAnimationComplete={handleSplashAnimationComplete}
              />
            )} */}
          </View>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
