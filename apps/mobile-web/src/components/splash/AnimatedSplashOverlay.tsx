import { palette } from '@/theme';
import { PawPrintIcon } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const LOGO_SIZE = 280;
const PAW_ICON_SIZE = 18;
const LOGO_PULSE_UP_SCALE = 1.06;
const LOGO_INITIAL_SCALE = 0.92;
const TAGLINE_INITIAL_TRANSLATE_Y = 12;

const ENTRANCE_DURATION_MS = 380;
const SETTLE_DURATION_MS = 260;
const HOLD_DURATION_MS = 450;
const EXIT_DURATION_MS = 360;

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

export interface AnimatedSplashOverlayProps {
  onAnimationComplete: () => void;
}

export function AnimatedSplashOverlay({
  onAnimationComplete,
}: AnimatedSplashOverlayProps) {
  const [containerOpacity] = useState(() => new Animated.Value(1));
  const [logoScale] = useState(() => new Animated.Value(LOGO_INITIAL_SCALE));
  const [taglineOpacity] = useState(() => new Animated.Value(0));
  const [taglineTranslateY] = useState(
    () => new Animated.Value(TAGLINE_INITIAL_TRANSLATE_Y),
  );

  useEffect(() => {
    const animationSequence = Animated.sequence([
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: LOGO_PULSE_UP_SCALE,
          duration: ENTRANCE_DURATION_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: ENTRANCE_DURATION_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
        Animated.timing(taglineTranslateY, {
          toValue: 0,
          duration: ENTRANCE_DURATION_MS,
          easing: Easing.out(Easing.quad),
          useNativeDriver: USE_NATIVE_DRIVER,
        }),
      ]),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: SETTLE_DURATION_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.delay(HOLD_DURATION_MS),
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: EXIT_DURATION_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]);

    animationSequence.start(({ finished }) => {
      if (finished) {
        onAnimationComplete();
      }
    });

    return () => {
      animationSequence.stop();
    };
  }, [
    containerOpacity,
    logoScale,
    onAnimationComplete,
    taglineOpacity,
    taglineTranslateY,
  ]);

  return (
    <Animated.View
      testID="animated-splash-overlay"
      pointerEvents="none"
      style={[styles.overlay, { opacity: containerOpacity }]}
    >
      <View className="items-center justify-center px-6">
        <Animated.View style={{ transform: [{ scale: logoScale }] }}>
          <Image
            source={require('../../../assets/figma/dog-face-happy-large.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </Animated.View>

        <Animated.View
          style={{
            opacity: taglineOpacity,
            transform: [{ translateY: taglineTranslateY }],
          }}
          className="items-center gap-2 mt-2"
        >
          <View className="bg-white/20 px-4 py-1.5 rounded-full flex-row items-center gap-2">
            <PawPrintIcon size={PAW_ICON_SIZE} color="#FFFFFF" weight="fill" />
            <Text className="font-heading-bold font-bold text-white text-sm tracking-wide">
              KAPA Protetores
            </Text>
          </View>
          <Text className="font-body text-white/90 text-xs tracking-wide">
            Cuidado, acolhimento e adoção responsável
          </Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: palette.orange,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
});
