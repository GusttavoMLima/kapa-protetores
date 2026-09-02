import { Text, TextInput, View } from 'react-native';
import { primaryInputTextStyles as styles } from './styles';
import { palette } from '@/theme/colors';

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  erro?: string;
};

export function PrimaryInputText({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  erro,
}: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={palette.inkMuted}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        style={[
          styles.input,
          multiline && styles.multiline,
          erro && styles.inputErro,
        ]}
      />
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
    </View>
  );
}
