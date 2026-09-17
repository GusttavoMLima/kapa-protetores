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
        <PrimaryButton title="Voltar à home" className="rounded-full w-[200]" />
        <PrimaryButton
          title="Relatar problema"
          className="rounded-full border-4 border-denim w-[160]"
          textColor="#2A4E75"
          size="sm"
          color="transparent"
        />
      </View>

      <Text className="absolute bottom-4 font-jakarta-medium text-ink-muted md:left-4 text-xs">
        Trace ID: 65d4asdas84sasda84sa
      </Text>
    </SafeAreaView>
  );
}
