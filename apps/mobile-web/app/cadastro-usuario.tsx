import { CadastroUsuarioScreen } from '@/screens/cadastroVoluntario';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';

export default function CadastroUsuarioRoute() {
  const { isLogged, isReady, user } = useAuth();

  if (!isReady) {
    return (
      <View className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator size="large" color="#F18322" />
      </View>
    );
  }

  if (!isLogged) return <Redirect href="/signIn" />;
  if (user?.role !== 'admin') return <Redirect href="/unauthorized" />;

  return <CadastroUsuarioScreen />;
}
