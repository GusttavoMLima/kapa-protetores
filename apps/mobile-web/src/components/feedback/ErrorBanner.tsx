import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const FADE_IN_DURATION_MS = 180;
const SHAKE_STEP_DURATION_MS = 55;
const SHAKE_PRIMARY_OFFSET_PX = 6;
const SHAKE_SECONDARY_OFFSET_PX = 4;

interface ErrorBannerProps {
  message?: string | null;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  const bannerOpacity = useSharedValue(0);
  const bannerTranslateX = useSharedValue(0);

  useEffect(() => {
    if (!message) {
      bannerOpacity.value = 0;
      bannerTranslateX.value = 0;
      return;
    }

    bannerOpacity.value = withTiming(1, {
      duration: FADE_IN_DURATION_MS,
      easing: Easing.out(Easing.quad),
    });

    bannerTranslateX.value = withSequence(
      withTiming(-SHAKE_PRIMARY_OFFSET_PX, { duration: SHAKE_STEP_DURATION_MS }),
      withTiming(SHAKE_PRIMARY_OFFSET_PX, { duration: SHAKE_STEP_DURATION_MS }),
      withTiming(-SHAKE_SECONDARY_OFFSET_PX, { duration: SHAKE_STEP_DURATION_MS }),
      withTiming(0, { duration: SHAKE_STEP_DURATION_MS }),
    );
  }, [bannerOpacity, bannerTranslateX, message]);

  const bannerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: bannerOpacity.value,
    transform: [{ translateX: bannerTranslateX.value }],
  }));

  if (!message) return null;

  return (
    <Animated.View style={[styles.container, bannerAnimatedStyle]}>
      <View className="w-full p-3 rounded-lg bg-[#FFDAD6] border border-[#BA1A1A]/30">
        <Text className="text-xs font-semibold text-[#93000A] text-center">
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
