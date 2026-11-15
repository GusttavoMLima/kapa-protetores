import { useEffect } from 'react';
import { AccessibilityInfo, Keyboard, Modal, Platform, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { BoneIcon } from 'phosphor-react-native';
import { palette } from '@/theme';

export function FormSubmissionStatus({ message }: { message: string }) {
  const rotation = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  useEffect(() => {
    Keyboard.dismiss();
    rotation.value = withRepeat(
      withTiming(360, { duration: 1800, easing: Easing.linear }),
      -1,
    );
    return () => cancelAnimation(rotation);
  }, [rotation]);

  useEffect(() => {
    if (Platform.OS !== 'web') AccessibilityInfo.announceForAccessibility(message);
  }, [message]);

  return (
    <View
      accessibilityViewIsModal
      className="flex-1 items-center justify-center gap-6 bg-cream p-6"
    >
      <View
        aria-hidden
        className="h-24 w-24 items-center justify-center rounded-full bg-peach"
      >
        <Animated.View style={animatedStyle}>
          <BoneIcon size={52} color={palette.denim} weight="fill" />
        </Animated.View>
      </View>
      <Text
        role="status"
        accessibilityLiveRegion="polite"
        className="text-center font-heading-bold text-xl text-ink"
      >
        {message}
      </Text>
    </View>
  );
}

export function FormSubmissionLoader({ visible, message }: { visible: boolean; message: string }) {
  if (!visible) return null;

  return (
    <Modal visible presentationStyle="fullScreen" onRequestClose={() => {}}>
      <FormSubmissionStatus message={message} />
    </Modal>
  );
}
