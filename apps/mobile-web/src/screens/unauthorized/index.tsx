import { Image, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AngryDog from '@/../assets/mascots/angry.png';
import { router } from 'expo-router';
import { PrimaryButton } from '@/components/buttons';

export function UnauthorizedScreen() {
  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      className="flex flex-1 flex-col items-center justify-center gap-8 p-8 bg-cream"
    >
      <View className="flex flex-col items-center gap-4">
        <Text className="font-vietnam-bold text-5xl text-orange">Eita!!</Text>
        <Text className="font-jakarta-medium text-base text-center">
          Parece que você não tem permissão {'\n'}
          para acessar esta página
        </Text>
      </View>
      <Image source={AngryDog} className="w-48 h-48" resizeMode="contain" />
      <View className="flex flex-col gap-4 items-center">
        <PrimaryButton title="Voltar Correndo" fullWidth={false} onPress={() => router.replace('/')} />
      </View>
    </SafeAreaView>
  );
}
