import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Logo from '@/../assets/Logo 2.svg';
import { LoginForm } from '@/components/forms/login';

export function LoginScreen() {
  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      className="flex-1 bg-cream"
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="px-4 py-8"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex items-center justify-center mx-auto gap-4">
            <Logo width={184} height={75} />
            <Text className="text-3xl font-bold text-ink text-center">
              Bem-vindo de volta
            </Text>
            <Text className="text-base text-ink-muted text-center w-[280px]">
              Entre para acompanhar suas adoções e favoritos.
            </Text>
          </View>

          <View className="w-full md:w-1/2 md:mx-auto mt-4">
            <LoginForm />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
