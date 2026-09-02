import { memo, useState, type ReactNode } from 'react';
import {
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { Eye, EyeSlash } from 'phosphor-react-native';
import { secondaryInputTextStyles as styles } from './styles';
import { colors } from '@/theme/colors';

export type SecondaryInputTextProps = TextInputProps & {
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
    label,
    value,
    onChangeText,
    multiline = false,
    error,
    icon,
    isPassword = false,
    style,
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
      <View style={styles.wrap}>
        {label ? <Text style={styles.label}>{label}</Text> : null}

        <View style={styles.inputContainer}>
          {icon ? <View style={styles.icon}>{icon}</View> : null}

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
            style={[
              styles.input,
              multiline && styles.multiline,
              !!icon && styles.inputWithIcon,
              isPassword && styles.inputWithRightIcon,
              hasError && styles.inputError,
              style,
            ]}
            {...rest}
          />

          {isPassword ? (
            <Pressable
              onPress={() => setIsSecure((prev) => !prev)}
              style={styles.rightIcon}
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
          <Text style={styles.error} accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);

SecondaryInputText.displayName = 'SecondaryInputText';

export { SecondaryInputText };
