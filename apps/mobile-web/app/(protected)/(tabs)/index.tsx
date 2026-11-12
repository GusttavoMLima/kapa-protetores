import { HomeScreen } from '@/screens/home';
import { useAuth } from '@/hooks/useAuth';
import { Redirect } from 'expo-router';

export default function IndexScreen() {
  const { user } = useAuth();
  if (user?.role === 'adopter') return <Redirect href="/adopet" />;
  return <HomeScreen />;
}
