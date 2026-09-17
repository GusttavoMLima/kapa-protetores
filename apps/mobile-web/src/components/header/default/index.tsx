import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BellIcon } from 'phosphor-react-native';
import Logo from '@/../assets/Logo 2.svg';

export const DefaultHeader = () => {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-row items-center justify-between px-4 py-3 bg-cream"
      style={{ paddingTop: insets.top + 8 }}
    >
      <Logo width={120} height={40} />
      <Pressable className="flex-row items-center justify-center relative w-10 h-10 rounded-full active:bg-peach">
        <BellIcon size={26} color="#1C1C19" />
        <Text className="text-center absolute -top-0.5 -right-0.5 bg-orange text-white text-[10px] font-bold p-0.5 size-5 rounded-full overflow-hidden leading-4">
          1
        </Text>
      </Pressable>
    </View>
  );
};
