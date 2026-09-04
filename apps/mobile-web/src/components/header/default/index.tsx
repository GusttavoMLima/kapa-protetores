import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BellIcon } from 'phosphor-react-native';

import { defaultHeaderStyles as styles } from './styles';
import Logo from '@/../assets/Logo 2.svg';
export const DefaultHeader = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <Logo width={120} height={40} />
      <Pressable
        style={({ pressed }) => [
          styles.bellWrapper,
          pressed && styles.bellHover,
        ]}
      >
        <BellIcon size={26} />
        <Text style={styles.counter}>1</Text>
      </Pressable>
    </View>
  );
};
