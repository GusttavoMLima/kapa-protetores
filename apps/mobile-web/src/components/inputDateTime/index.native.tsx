import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CalendarIcon, ClockIcon } from 'phosphor-react-native';
import { palette } from '@/theme';
import type { DateTimeFieldProps } from './types';

function pad(value: number): string { return String(value).padStart(2, '0'); }

function toDate(value: string, mode: 'date' | 'time'): Date {
  const now = new Date();
  if (mode === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day, 12);
  }
  if (mode === 'time' && /^\d{2}:\d{2}$/.test(value)) {
    const [hours, minutes] = value.split(':').map(Number);
    now.setHours(hours, minutes, 0, 0);
  }
  return now;
}

function formatValue(value: Date, mode: 'date' | 'time'): string {
  if (mode === 'date') return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  return `${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function displayValue(value: string, mode: 'date' | 'time'): string {
  if (!value) return mode === 'date' ? 'Selecionar data' : 'Selecionar horário';
  if (mode === 'date') {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }
  return value;
}

export function DateTimeField({ label, value, onChange, mode, error, containerStyle }: DateTimeFieldProps) {
  const [visible, setVisible] = useState(false);
  const Icon = mode === 'date' ? CalendarIcon : ClockIcon;

  return (
    <View style={containerStyle} className="flex flex-col gap-1.5">
      <Text className="text-xs font-bold text-ink tracking-wide">{label}</Text>
      <Pressable
        onPress={() => setVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${displayValue(value, mode)}`}
        className={`w-full min-h-[48px] flex-row items-center justify-between rounded-xl border bg-white px-3.5 py-3 ${error ? 'border-danger' : 'border-border'}`}
      >
        <Text className={value ? 'text-base text-ink' : 'text-base text-inkMuted'}>{displayValue(value, mode)}</Text>
        <Icon size={20} color={palette.inkMuted} />
      </Pressable>
      {visible ? (
        <DateTimePicker value={toDate(value, mode)} mode={mode} is24Hour onChange={(_, selectedValue) => {
          setVisible(false);
          if (selectedValue) onChange(formatValue(selectedValue, mode));
        }} />
      ) : null}
      {error ? <Text className="text-xs font-semibold text-danger">{error}</Text> : null}
    </View>
  );
}
