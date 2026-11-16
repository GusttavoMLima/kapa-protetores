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
      {/* Telas internas ficam em (tabs) para manter cabeçalho e barra de abas. */}
      <Stack.Screen name="(tabs)" />
      {/* Cadastro inicial do adotante fica fora das abas: o layout das abas redireciona para cá. */}
      <Stack.Screen name="adopter-profile" />
    </Stack>
  );
}
