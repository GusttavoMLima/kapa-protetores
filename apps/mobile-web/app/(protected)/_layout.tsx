import '@/../global.css';
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';

export default function ProtectedLayout() {
  const { isLogged, isReady } = useAuth();

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
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
      <Stack.Screen name="adopet/[id]" />
      <Stack.Screen name="adopet/[id]/application" />
      <Stack.Screen name="my-adoptions" />
      <Stack.Screen name="my-events" />
      <Stack.Screen name="gestao/solicitacoes" />
      <Stack.Screen name="manage-activities" />
      <Stack.Screen name="adopter-profile" />
      <Stack.Screen name="(adopter)/pix" />
      <Stack.Screen name="(adopter)/edit-profile" />
    </Stack>
  );
}
