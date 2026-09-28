import {
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { palette } from '@/theme/colors';


type Props = {
  className?: string;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  erro?: string;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  maxLength?: number;
  secureTextEntry?: boolean;
  editable?: boolean;
};

export function PrimaryInputText({
  className,
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  erro,
  keyboardType,
  autoCapitalize,
  maxLength,
  secureTextEntry,
  editable = true,
}: Props) {
  return (
    <View className={`flex flex-col gap-1.5 ${className ?? ''}`}>
      <Text className="text-xs font-bold text-ink tracking-wide">{label}</Text>
      <TextInput
        value={value}
        editable={editable}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.inkMuted}
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        maxLength={maxLength}
        secureTextEntry={secureTextEntry}
        accessibilityLabel={label}
        aria-invalid={Boolean(erro)}
        textAlignVertical={multiline ? 'top' : 'center'}
        className={`w-full bg-white border rounded-xl px-3.5 py-3 text-base text-ink ${
          multiline ? 'min-h-[96px] pt-3' : 'min-h-[48px]'
        } ${erro ? 'border-danger' : 'border-border'}`}
      />
      {erro ? <Text className="text-xs font-semibold text-danger">{erro}</Text> : null}
    </View>
  );
}
