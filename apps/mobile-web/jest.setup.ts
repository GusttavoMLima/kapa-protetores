// Setup file for Jest in apps/mobile-web
// Expo and React Native standard mocks are automatically loaded by jest-expo

// Mock AsyncStorage using the official mock implementation
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock react-native-reanimated so hooks and Animated components execute synchronously
// in Jest without requiring the native JSI Worklets TurboModule runtime
jest.mock('react-native-reanimated', () => {
  const { FlatList, Image, ScrollView, Text, View } =
    jest.requireActual('react-native');

  return {
    __esModule: true,
    default: {
      View,
      Text,
      Image,
      ScrollView,
      FlatList,
      createAnimatedComponent: (Component: unknown) => Component,
    },
    useSharedValue: <T>(initialValue: T) => ({ value: initialValue }),
    useAnimatedStyle: <T extends object>(updater: () => T) => updater(),
    useDerivedValue: <T>(updater: () => T) => ({ value: updater() }),
    useAnimatedProps: <T extends object>(updater: () => T) => updater(),
    withTiming: <T>(toValue: T, _config?: unknown, callback?: (finished?: boolean) => void) => {
      callback?.(true);
      return toValue;
    },
    withSpring: <T>(toValue: T, _config?: unknown, callback?: (finished?: boolean) => void) => {
      callback?.(true);
      return toValue;
    },
    withDelay: <T>(_delayMs: number, animation: T) => animation,
    withRepeat: <T>(animation: T) => animation,
    withSequence: <T>(...animations: T[]) => animations[animations.length - 1],
    cancelAnimation: jest.fn(),
    runOnJS: <T extends (...args: never[]) => unknown>(fn: T) => fn,
    runOnUI: <T extends (...args: never[]) => unknown>(fn: T) => fn,
    interpolate: (value: number, inputRange: readonly number[], outputRange: readonly number[]) => {
      if (inputRange.length < 2 || outputRange.length < 2) {
        return value;
      }
      const minIn = inputRange[0] ?? 0;
      const maxIn = inputRange[inputRange.length - 1] ?? 1;
      const minOut = outputRange[0] ?? 0;
      const maxOut = outputRange[outputRange.length - 1] ?? 1;
      if (maxIn === minIn) {
        return minOut;
      }
      const ratio = Math.min(1, Math.max(0, (value - minIn) / (maxIn - minIn)));
      return minOut + ratio * (maxOut - minOut);
    },
    Extrapolation: {
      EXTEND: 'extend',
      CLAMP: 'clamp',
      IDENTITY: 'identity',
    },
    Easing: {
      linear: (t: number) => t,
      ease: (t: number) => t,
      quad: (t: number) => t * t,
      cubic: (t: number) => t * t * t,
      in: <T>(easing: T) => easing,
      out: <T>(easing: T) => easing,
      inOut: <T>(easing: T) => easing,
      bezier: () => (t: number) => t,
    },
  };
});
