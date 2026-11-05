import { useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { cn } from '@/utils/cn';

const CHIP_POP_SCALE = 1.05;
const CHIP_REST_SCALE = 1;
const CHIP_SPRING_CONFIG = {
  damping: 13,
  stiffness: 210,
};

export type Option<T extends string> = {
  value: T;
  label: string;
};

export type PrimaryChipGroupProps<T extends string> = {
  className?: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export type PrimaryChipProps = {
  selected: boolean;
  label: string;
  onPress: VoidFunction;
  disabled?: boolean;
  className?: string;
};

export const PrimaryChip = ({
  selected,
  label,
  onPress,
  disabled = false,
  className,
}: PrimaryChipProps) => {
  const chipScale = useSharedValue(CHIP_REST_SCALE);
  const didMountRef = useRef(false);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    if (selected) {
      chipScale.value = withSequence(
        withSpring(CHIP_POP_SCALE, CHIP_SPRING_CONFIG),
        withSpring(CHIP_REST_SCALE, CHIP_SPRING_CONFIG),
      );
    } else {
      chipScale.value = withSpring(CHIP_REST_SCALE, CHIP_SPRING_CONFIG);
    }
  }, [chipScale, selected]);

  const chipAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: chipScale.value }],
  }));

  return (
    <Animated.View style={chipAnimatedStyle}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="radio"
        accessibilityLabel={label}
        accessibilityState={{ selected, disabled }}
        hitSlop={6}
        className={cn(
          'border rounded-full px-4 py-2.5 min-h-[44px] justify-center items-center transition-all',
          selected
            ? 'bg-orange border-orange'
            : 'bg-white border-border active:bg-cream',
          disabled && 'opacity-50 cursor-not-allowed',
          className,
        )}
      >
        <Text
          className={cn(
            'text-sm font-semibold',
            selected ? 'text-white' : 'text-ink',
          )}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

export function PrimaryChipGroup<T extends string>({
  className,
  options,
  value,
  onChange,
}: PrimaryChipGroupProps<T>) {
  return (
    <View className={cn('flex-row flex-wrap gap-2', className)}>
      {options.map((option) => (
        <PrimaryChip
          key={option.value}
          label={option.label}
          selected={option.value === value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}
