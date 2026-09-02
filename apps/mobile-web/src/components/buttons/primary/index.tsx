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
import { palette } from '@/theme';
import { primaryButtonStyles as styles } from './styles';

export type PrimaryButtonSize = 'sm' | 'md' | 'lg';

export type PrimaryButtonProps = Omit<PressableProps, 'style' | 'children'> & {
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
    | ((state: { pressed: boolean; hovered?: boolean }) => StyleProp<ViewStyle>);
};

export const PrimaryButton = memo(
  ({
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
    const backgroundColor = color ?? palette.orange;
    const pressedBackgroundColor = pressedColor ?? palette.orangeDark;
    const hasIcon = Boolean(icon) && !loading;

    const sizeStyle =
      size === 'sm'
        ? styles.sizeSm
        : size === 'lg'
          ? styles.sizeLg
          : styles.sizeMd;

    const textSizeStyle =
      size === 'sm'
        ? styles.textSm
        : size === 'lg'
          ? styles.textLg
          : undefined;

    const getIconPositionStyle = () => {
      if (iconPosition === 'right') {
        return size === 'sm'
          ? styles.iconRightSm
          : size === 'lg'
            ? styles.iconRightLg
            : styles.iconRightMd;
      }
      return size === 'sm'
        ? styles.iconLeftSm
        : size === 'lg'
          ? styles.iconLeftLg
          : styles.iconLeftMd;
    };

    const iconPaddingStyle = hasIcon
      ? size === 'sm'
        ? { paddingHorizontal: 38 }
        : size === 'lg'
          ? { paddingHorizontal: 54 }
          : { paddingHorizontal: 46 }
      : undefined;

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
            style={[
              styles.text,
              textSizeStyle,
              { color: textColor },
              textStyle,
            ]}
          >
            {title ?? children}
          </Text>
        );
      }

      return children;
    };

    const label =
      accessibilityLabel ??
      (typeof children === 'string' ? children : title);

    return (
      <Pressable
        disabled={!isInteractive}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={label}
        accessibilityState={{
          disabled: !isInteractive,
          busy: loading,
        }}
        style={(state) => [
          styles.button,
          sizeStyle,
          fullWidth ? styles.fullWidth : styles.autoWidth,
          iconPaddingStyle,
          { backgroundColor },
          state.pressed && isInteractive && {
            backgroundColor: pressedBackgroundColor,
            ...styles.pressed,
          },
          !isInteractive && styles.disabled,
          typeof style === 'function' ? style(state) : style,
        ]}
        {...rest}
      >
        {hasIcon && (
          <View
            style={[styles.iconContainer, getIconPositionStyle()]}
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
