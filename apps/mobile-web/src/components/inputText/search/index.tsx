import { TextInput, View } from 'react-native';
import { MagnifyingGlassIcon } from 'phosphor-react-native';
import { palette } from '@/theme';

interface SearchFieldProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  accessibilityLabel: string;
}

/** Campo de busca padrão das telas de gestão (lupa, borda e alvo de toque de 48px). */
export function SearchField({ value, onChangeText, placeholder, accessibilityLabel }: SearchFieldProps) {
  return (
    <View className="flex-row items-center gap-3 border border-border bg-cream rounded-md px-4">
      <MagnifyingGlassIcon size={20} color={palette.denim} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        maxLength={120}
        autoCapitalize="none"
        placeholder={placeholder}
        accessibilityLabel={accessibilityLabel}
        placeholderTextColor={palette.inkMuted}
        className="min-h-12 flex-1 py-3 font-body text-base text-ink"
      />
    </View>
  );
}
