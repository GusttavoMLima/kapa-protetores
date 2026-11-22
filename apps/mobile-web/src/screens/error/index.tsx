import { router } from 'expo-router';
import { PrimaryButton } from '@/components/buttons';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TroubleMascot from '@/../assets/mascots/trouble.svg';

export function ErrorScreen() {
  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      className="flex flex-1 flex-col items-center justify-center gap-8 p-8"
    >
      <View className="flex flex-col items-center gap-4">
        <Text className="font-vietnam-bold text-5xl text-orange">Oops!!</Text>
        <Text className="font-jakarta-medium text-base text-center">
          Algo deu errado, não se preocupe {'\n'}
          Nossa equipe está trabalhando nisso
        </Text>
      </View>
      <TroubleMascot />
      <View className="flex flex-col gap-4 items-center">
        <PrimaryButton title="Voltar à home" fullWidth={false} onPress={() => router.replace('/')} />
      </View>
    </SafeAreaView>
  );
}
