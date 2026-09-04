import { Pressable, Text, View } from 'react-native';
import { primaryChipStyles as styles } from './styles';

type Option<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

type ChipProps = {
  selected: boolean;
  label: string;
  onPress: VoidFunction;
};

const PrimaryChip = ({ selected, label, onPress }: ChipProps) => {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
    </Pressable>
  );
};

export function PrimaryChipGroup<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <View style={styles.row}>
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
