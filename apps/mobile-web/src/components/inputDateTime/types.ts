import type { StyleProp, ViewStyle } from 'react-native';

export type DateTimeFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  mode: 'date' | 'time';
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
};
