import { Pressable, Text, View } from 'react-native';

type Option<T extends string> = {
  value: T;
  label: string;
};

type Props<T extends string> = {
  className?: string;
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
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      className={`border rounded-full px-3.5 py-2.5 ${
        selected ? 'bg-orange border-orange' : 'bg-white border-border'
      }`}
    >
      <Text
        className={`text-sm font-semibold ${
          selected ? 'text-white' : 'text-ink'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
};

export function PrimaryChipGroup<T extends string>({
  className,
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <View className={`flex-row flex-wrap gap-2 ${className ?? ''}`}>
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
