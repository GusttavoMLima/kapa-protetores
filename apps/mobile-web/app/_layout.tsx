import '@/../global.css';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { palette } from '@/theme/colors';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AuthProvider } from '@/contexts/authProvider';


SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
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
      <AuthProvider>
        <View
          style={{
            flex: 1,
            backgroundColor: palette.cream,
          }}
        >
          <StatusBar style="light" />

          <Stack>
            <Stack.Screen
              name="(protected)"
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
          </Stack>
        </View>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
