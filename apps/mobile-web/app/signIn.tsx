import { LoginScreen } from '@/screens/login';
import { useAuth } from '@/hooks/useAuth';
import { Redirect } from 'expo-router';

export default function SignIn() {
  const { isLogged, isReady } = useAuth();

  if (isReady && isLogged) {
    return <Redirect href="/" />;
  }

  return <LoginScreen />;
}

