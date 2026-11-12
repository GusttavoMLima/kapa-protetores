import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BellIcon } from 'phosphor-react-native';
import Logo from '@/../assets/Logo 2.svg';
import { useAuth } from '@/hooks/useAuth';
import { isShelterStaff } from '@/navigation/access';
import { router } from 'expo-router';
import { palette } from '@/theme';

export const DefaultHeader = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  return (
    <View
      className="bg-white border-b border-line"
      style={{ paddingTop: insets.top + 8 }}
    >
      <View className="w-full max-w-content self-center flex-row items-center justify-between px-5 md:px-10 pb-3 gap-3">
        <Logo width={100} height={40} />
        <View className="flex-row items-center gap-3">
          <View className="rounded-full bg-peach px-3 py-2"><Text className="font-body-medium text-xs text-denim">{isShelterStaff(user?.role) ? 'Equipe do abrigo' : 'Comunidade Kapa'}</Text></View>
          <Pressable onPress={() => router.push('/my-events')} accessibilityRole="button" accessibilityLabel="Ver minha atividade recente" className="items-center justify-center size-12 rounded-full bg-cream active:bg-peach">
            <BellIcon size={24} color={palette.denim} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};
