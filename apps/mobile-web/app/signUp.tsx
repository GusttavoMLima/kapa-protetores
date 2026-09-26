import { RegisterScreen } from '@/screens/register';
import { useAuth } from '@/hooks/useAuth';
import { Redirect } from 'expo-router';

export default function SignUp() {
  const { isLogged, isReady } = useAuth();

  if (isReady && isLogged) {
    return <Redirect href="/" />;
  }

  return <RegisterScreen />;
}
