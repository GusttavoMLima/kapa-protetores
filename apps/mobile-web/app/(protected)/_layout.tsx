import '@/../global.css';
import { Redirect, Stack, usePathname } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { canVisitScreen, homeForRole } from '@/navigation/access';

export default function ProtectedLayout() {
  const { isLogged, isReady, user } = useAuth();
  const pathname = usePathname();

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

  if (!canVisitScreen(user?.role, pathname)) {
    return <Redirect href={homeForRole(user?.role)} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="adopet/[id]" />
      <Stack.Screen name="adopet/[id]/application" />
      <Stack.Screen name="my-adoptions" />
      <Stack.Screen name="my-events" />
      <Stack.Screen name="my-favorites" />
      <Stack.Screen name="gestao/solicitacoes" />
      <Stack.Screen name="gestao/voluntarios" />
      <Stack.Screen name="gestao/usuarios" />
      <Stack.Screen name="manage-activities" />
      <Stack.Screen name="adopter-profile" />
      <Stack.Screen name="(adopter)/pix" />
      <Stack.Screen name="(adopter)/edit-profile" />
    </Stack>
  );
}
