import { useAuth } from '@/hooks/useAuth';
import { Button } from 'react-native';

export default function IndexScreen() {
  const { signOut } = useAuth();
  return <Button title="Sair" onPress={signOut} />;
}
