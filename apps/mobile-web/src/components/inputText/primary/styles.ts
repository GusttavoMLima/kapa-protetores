import { StyleSheet } from 'react-native';
import { palette } from '@/theme/colors';

export const primaryInputTextStyles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  input: {
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: palette.ink,
    fontSize: 16,
  },
  multiline: {
    minHeight: 96,
    paddingTop: 12,
  },
  inputErro: {
    borderColor: palette.danger,
  },
  erro: {
    color: palette.danger,
    fontSize: 12,
    fontWeight: '600',
  },
});
