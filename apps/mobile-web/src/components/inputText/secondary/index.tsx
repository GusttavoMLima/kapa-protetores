import { memo, useState, type ReactNode } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { Eye, EyeSlash } from 'phosphor-react-native';
import { colors } from '@/theme/colors';

export type SecondaryInputTextProps = TextInputProps & {
  className?: string;
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  error?: string;
  icon?: ReactNode;
  isPassword?: boolean;
};

const SecondaryInputText = memo(
  ({
    className,
    label,
    value,
    onChangeText,
    multiline = false,
    error,
    icon,
    isPassword = false,
    placeholderTextColor,
    autoCapitalize,
    autoCorrect,
    ...rest
  }: SecondaryInputTextProps) => {
    const [isSecure, setIsSecure] = useState(true);
    const hasError = Boolean(error);
    const placeholderColor =
      placeholderTextColor ?? colors.secondaryInpuText.placeholderColor;

    return (
      <View className={`flex flex-col gap-2 w-full ${className ?? ''}`}>
        {label ? (
          <Text className="text-sm font-semibold text-ink-muted">{label}</Text>
        ) : null}

        <View className="relative justify-center">
          {icon ? (
            <View className="absolute left-3.5 z-10 items-center justify-center">
              {icon}
            </View>
          ) : null}

          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholderTextColor={placeholderColor}
            multiline={isPassword ? false : multiline}
            textAlignVertical={multiline ? 'top' : 'center'}
            secureTextEntry={isPassword ? isSecure : rest.secureTextEntry}
            autoCapitalize={
              isPassword ? (autoCapitalize ?? 'none') : autoCapitalize
            }
            autoCorrect={isPassword ? (autoCorrect ?? false) : autoCorrect}
            className={`w-full bg-white border rounded-xl px-3.5 py-3 text-base text-ink min-h-[56px] ${
              icon ? 'pl-12' : ''
            } ${isPassword ? 'pr-13' : ''} ${
              hasError ? 'border-danger' : 'border-border'
            } ${multiline ? 'min-h-[100px] pt-3.5' : ''}`}
            {...rest}
          />

          {isPassword ? (
            <Pressable
              onPress={() => setIsSecure((prev) => !prev)}
              className="absolute right-3.5 z-10 items-center justify-center"
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={isSecure ? 'Show password' : 'Hide password'}
            >
              {isSecure ? (
                <Eye size={20} color={placeholderColor as string} />
              ) : (
                <EyeSlash size={20} color={placeholderColor as string} />
              )}
            </Pressable>
          ) : null}
        </View>

        {error ? (
          <Text className="text-xs text-danger mt-1" accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);

SecondaryInputText.displayName = 'SecondaryInputText';

export { SecondaryInputText };
