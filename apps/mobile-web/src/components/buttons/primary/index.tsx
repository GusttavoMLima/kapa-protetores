import { memo, type ReactNode } from 'react';

import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type StyleProp,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native';

import { cn } from '@/utils/cn';
import { palette } from '@/theme';

export type PrimaryButtonSize = 'sm' | 'md' | 'lg';

export type PrimaryButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  className?: string;
  title?: string;
  children?: ReactNode;
  color?: string;
  pressedColor?: string;
  textColor?: string;
  textStyle?: StyleProp<TextStyle>;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  loadingColor?: string;
  size?: PrimaryButtonSize;
  fullWidth?: boolean;
  style?:
    | StyleProp<ViewStyle>
    | ((state: {
        pressed: boolean;
        hovered?: boolean;
      }) => StyleProp<ViewStyle>);
};

export const PrimaryButton = memo(
  ({
    className,
    title,
    children,
    color,
    pressedColor,
    textColor = palette.white,
    textStyle,
    icon,
    iconPosition = 'left',
    loading = false,
    loadingColor,
    disabled = false,
    size = 'md',
    fullWidth = true,
    style,
    accessibilityRole = 'button',
    accessibilityLabel,
    ...rest
  }: PrimaryButtonProps) => {
    const isInteractive = !disabled && !loading;

    const pressedBackgroundColor =
      pressedColor ?? (color ? undefined : palette.orangeDark);

    const hasIcon = Boolean(icon) && !loading;

    const sizeClasses = {
      sm: 'py-2.5 px-4 min-h-[40px]',
      md: 'py-4 px-5 min-h-[52px]',
      lg: 'py-[18px] px-6 min-h-[58px]',
    }[size];

    const textSizeClasses = {
      sm: 'text-sm leading-[18px]',
      md: 'text-base leading-5',
      lg: 'text-lg leading-[22px]',
    }[size];

    const iconPositionClasses =
      iconPosition === 'right'
        ? {
            sm: 'right-3.5',
            md: 'right-[18px]',
            lg: 'right-[22px]',
          }[size]
        : {
            sm: 'left-3.5',
            md: 'left-[18px]',
            lg: 'left-[22px]',
          }[size];

    const iconPaddingClasses = hasIcon
      ? {
          sm: 'px-[38px]',
          md: 'px-[46px]',
          lg: 'px-[54px]',
        }[size]
      : '';

    const renderContent = () => {
      if (loading) {
        return (
          <ActivityIndicator
            size="small"
            color={loadingColor ?? textColor ?? palette.white}
          />
        );
      }

      if (typeof children === 'string' || title) {
        return (
          <Text
            className={cn('font-bold text-center', textSizeClasses)}
            style={[{ color: textColor }, textStyle]}
          >
            {title ?? children}
          </Text>
        );
      }

      return children;
    };

    const label =
      accessibilityLabel ?? (typeof children === 'string' ? children : title);

    const defaultStyles =
      'flex-row items-center justify-center rounded-lg relative';

    const buttonClassName = cn(
      defaultStyles,
      sizeClasses,
      fullWidth ? 'w-full' : 'w-auto self-start',
      iconPaddingClasses,
      !isInteractive ? 'opacity-55' : 'active:scale-[0.99]',
      !color && 'bg-orange active:bg-orange-dark',
      className,
    );

    return (
      <Pressable
        {...rest}
        className={buttonClassName}
        disabled={!isInteractive}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={label}
        accessibilityState={{
          disabled: !isInteractive,
          busy: loading,
        }}
        style={(state) => [
          color ? { backgroundColor: color } : null,
          pressedBackgroundColor && state.pressed && isInteractive
            ? { backgroundColor: pressedBackgroundColor }
            : null,
          typeof style === 'function' ? style(state) : style,
        ]}
      >
        {hasIcon && (
          <View
            className={cn(
              'absolute top-0 bottom-0 justify-center items-center',
              iconPositionClasses,
            )}
            pointerEvents="none"
          >
            {icon}
          </View>
        )}

        {renderContent()}
      </Pressable>
    );
  },
);

PrimaryButton.displayName = 'PrimaryButton';
