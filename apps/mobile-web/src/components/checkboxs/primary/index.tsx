import {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Pressable,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { CheckIcon, MinusIcon } from 'phosphor-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { cn } from '@/utils/cn';
import { palette } from '@/theme';

const CHECKBOX_POP_SCALE = 1.15;
const CHECKBOX_REST_SCALE = 1;
const CHECKBOX_SPRING_CONFIG = {
  damping: 12,
  stiffness: 220,
};

export type PrimaryCheckBoxSize = 'sm' | 'md' | 'lg';

export interface PrimaryCheckBoxProps
  extends Omit<PressableProps, 'children' | 'style' | 'onChange'> {
  checked?: boolean;
  value?: boolean;
  defaultChecked?: boolean;
  initialState?: boolean;
  label?: ReactNode;
  description?: string;
  error?: string;
  disabled?: boolean;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
  onValueChange?: (checked: boolean) => void;
  onClick?: (state: boolean) => void;
  size?: PrimaryCheckBoxSize;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

const sizeConfig: Record<
  PrimaryCheckBoxSize,
  {
    boxClasses: string;
    iconSize: number;
    labelClasses: string;
  }
> = {
  sm: {
    boxClasses: 'w-[18px] h-[18px] rounded',
    iconSize: 12,
    labelClasses: 'text-xs leading-4',
  },
  md: {
    boxClasses: 'w-[22px] h-[22px] rounded-[6px]',
    iconSize: 14,
    labelClasses: 'text-sm leading-5',
  },
  lg: {
    boxClasses: 'w-[26px] h-[26px] rounded-md',
    iconSize: 16,
    labelClasses: 'text-base leading-6',
  },
};

export const PrimaryCheckBox = memo(function PrimaryCheckBox({
  checked,
  value,
  defaultChecked,
  initialState,
  label,
  description,
  error,
  disabled = false,
  indeterminate = false,
  onChange,
  onValueChange,
  onClick,
  size = 'md',
  className,
  style,
  accessibilityRole = 'checkbox',
  accessibilityLabel,
  accessibilityHint,
  hitSlop = 8,
  ...rest
}: PrimaryCheckBoxProps) {
  const isControlled = checked !== undefined || value !== undefined;
  const resolvedChecked = (checked ?? value) ?? false;
  const [internalChecked, setInternalChecked] = useState<boolean>(
    (defaultChecked ?? initialState) ?? false,
  );

  const isChecked = isControlled ? resolvedChecked : internalChecked;
  const showChecked = isChecked || indeterminate;

  const boxScale = useSharedValue(CHECKBOX_REST_SCALE);
  const didMountRef = useRef(false);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }

    if (showChecked) {
      boxScale.value = withSequence(
        withSpring(CHECKBOX_POP_SCALE, CHECKBOX_SPRING_CONFIG),
        withSpring(CHECKBOX_REST_SCALE, CHECKBOX_SPRING_CONFIG),
      );
    } else {
      boxScale.value = withSpring(CHECKBOX_REST_SCALE, CHECKBOX_SPRING_CONFIG);
    }
  }, [boxScale, showChecked]);

  const boxAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boxScale.value }],
  }));

  const handlePress = useCallback(() => {
    if (disabled) return;

    const nextState = !isChecked;
    if (!isControlled) {
      setInternalChecked(nextState);
    }

    onChange?.(nextState);
    onValueChange?.(nextState);
    onClick?.(nextState);
  }, [disabled, isChecked, isControlled, onChange, onValueChange, onClick]);

  const config = sizeConfig[size] ?? sizeConfig.md;
  const hasContent = Boolean(label || description || error);

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityState={{
        checked: indeterminate ? 'mixed' : isChecked,
        disabled,
      }}
      accessibilityLabel={
        accessibilityLabel ??
        (typeof label === 'string' ? label : undefined)
      }
      accessibilityHint={accessibilityHint}
      hitSlop={hitSlop}
      style={style}
      className={cn(
        'select-none',
        hasContent
          ? 'flex-row items-start gap-3 min-h-[44px] py-1.5'
          : 'items-center justify-center min-w-[44px] min-h-[44px]',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
      {...rest}
    >
      <Animated.View style={boxAnimatedStyle}>
        <View
          className={cn(
            'items-center justify-center border transition-colors mt-0.5',
            config.boxClasses,
            showChecked
              ? 'bg-orange border-orange'
              : error
                ? 'bg-white border-danger'
                : 'bg-white border-border hover:border-orange/60',
          )}
        >
          {indeterminate ? (
            <MinusIcon
              size={config.iconSize}
              weight="bold"
              color={palette.white}
            />
          ) : isChecked ? (
            <CheckIcon
              size={config.iconSize}
              weight="bold"
              color={palette.white}
            />
          ) : null}
        </View>
      </Animated.View>

      {hasContent ? (
        <View className="flex-1 justify-center">
          {typeof label === 'string' ? (
            <Text
              className={cn(
                'font-body-medium text-ink',
                config.labelClasses,
                disabled && 'text-ink-muted/60',
                error && 'text-danger',
              )}
            >
              {label}
            </Text>
          ) : (
            label
          )}
          {description ? (
            <Text className="font-body text-xs text-ink-muted mt-0.5">
              {description}
            </Text>
          ) : null}
          {error ? (
            <Text className="font-body-medium text-xs text-danger mt-0.5">
              {error}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Pressable>
  );
});
