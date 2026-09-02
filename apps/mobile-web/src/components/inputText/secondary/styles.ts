import { StyleSheet } from 'react-native';
import { colors, palette, typography } from '@/theme';

export const secondaryInputTextStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'column',
    gap: 8,
    width: '100%',
  },
  label: {
    ...typography['styles']['labelMd'],
    color: palette.inkSecondary,
  },
  inputContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    fontFamily: 'PlusJakartaSans-Regular',
    backgroundColor: colors.secondaryInpuText.backgroundColor,
    borderWidth: 1,
    borderColor: colors.secondaryInpuText.borderColor,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: palette.ink,
    fontSize: 16,
    minHeight: 56,
    outlineColor: colors.secondaryInpuText.borderColor,
  },
  inputWithIcon: {
    paddingLeft: 52,
  },
  multiline: {
    minHeight: 100,
    paddingTop: 14,
  },
  inputError: {
    borderColor: colors.error || '#E53935',
  },
  error: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 12,
    color: colors.error || '#E53935',
  },
  icon: {
    position: 'absolute',
    left: 14,
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWithRightIcon: {
    paddingRight: 54,
  },
  rightIcon: {
    position: 'absolute',
    right: 14,
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
