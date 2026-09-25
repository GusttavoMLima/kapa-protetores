import '@/../global.css';
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { palette } from '@/theme/colors';
import { useAuth } from '@/hooks/useAuth';

export default function ProtectedLayout() {
  const { isLogged, isReady } = useAuth();

  if (!isReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: palette.cream,
        }}
      >
        <ActivityIndicator size="large" color="#F18322" />
      </View>
    );
  }

  if (!isLogged) {
    return <Redirect href={'/signIn'} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="activities" />
    </Stack>
  );
}
