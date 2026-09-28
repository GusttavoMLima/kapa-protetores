import type React from 'react';
import { Text, View } from 'react-native';
import { palette } from '@/theme';
import type { DateTimeFieldProps } from './types';

export function DateTimeField({ label, value, onChange, mode, error, containerStyle }: DateTimeFieldProps) {
  return (
    <View style={containerStyle} className="flex flex-col gap-1.5">
      <Text className="text-xs font-bold text-ink tracking-wide">{label}</Text>
      <input
        type={mode}
        value={value}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        aria-label={label}
        aria-invalid={Boolean(error)}
        style={{
          width: '100%', minHeight: 48, border: `1px solid ${error ? palette.danger : palette.line}`,
          borderRadius: 12, padding: '10px 14px', backgroundColor: palette.white, color: palette.ink,
          fontSize: 16, fontFamily: 'PlusJakartaSans-Regular, sans-serif', boxSizing: 'border-box',
        }}
      />
      {error ? <Text className="text-xs font-semibold text-danger">{error}</Text> : null}
    </View>
  );
}
