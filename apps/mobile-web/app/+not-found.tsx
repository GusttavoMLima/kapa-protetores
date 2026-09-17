import { ErrorScreen } from '@/screens/error';
import { Stack } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Não encontrado', headerShown: false }} />
      <ErrorScreen />
    </>
  );
}
