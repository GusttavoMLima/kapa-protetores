import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeftIcon } from 'phosphor-react-native';
import { router } from 'expo-router';
import Logo from '@/../assets/Logo 2.svg';
import { RegisterForm } from '@/components/forms/register';

export function RegisterScreen() {
  return (
    <SafeAreaView
      edges={['top', 'left', 'right', 'bottom']}
      className="flex-1 bg-cream"
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerClassName="px-4 py-4"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full md:w-1/2 md:mx-auto mb-2">
            <Pressable
              onPress={() => router.back()}
              className="w-10 h-10 items-center justify-center rounded-full active:bg-peach"
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <ArrowLeftIcon size={24} color="#1C1C19" />
            </Pressable>
          </View>

          <View className="flex items-center justify-center mx-auto gap-3">
            <Logo width={184} height={75} />
            <Text className="text-3xl font-bold text-ink text-center">
              Crie sua conta
            </Text>
            <Text className="text-base text-ink-muted text-center w-[290px]">
              Junte-se ao Kapa para adotar pets e apoiar protetores.
            </Text>
          </View>

          <View className="w-full md:w-1/2 md:mx-auto mt-4">
            <RegisterForm />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
