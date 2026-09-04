import { Platform, StyleSheet } from 'react-native';
import { palette, typography } from '@/theme';

export const primaryButtonStyles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    position: 'relative',
    ...Platform.select({
      web: {
        cursor: 'pointer',
        userSelect: 'none',
        transition: 'background-color 0.15s ease, transform 0.1s ease',
      } as any,
    }),
  },
  sizeSm: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 40,
  },
  sizeMd: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    minHeight: 52,
  },
  sizeLg: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    minHeight: 58,
  },
  fullWidth: {
    width: '100%',
  },
  autoWidth: {
    width: 'auto',
    alignSelf: 'flex-start',
  },
  iconContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconLeftSm: {
    left: 14,
  },
  iconLeftMd: {
    left: 18,
  },
  iconLeftLg: {
    left: 22,
  },
  iconRightSm: {
    right: 14,
  },
  iconRightMd: {
    right: 18,
  },
  iconRightLg: {
    right: 22,
  },
  pressed: {
    ...Platform.select({
      web: {
        transform: 'scale(0.99)',
      } as any,
    }),
  },
  disabled: {
    opacity: 0.55,
    ...Platform.select({
      web: {
        cursor: 'not-allowed',
      } as any,
    }),
  },
  text: {
    ...typography.styles.labelMd,
    color: palette.white,
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
  },
  textSm: {
    fontSize: 14,
    lineHeight: 18,
  },
  textLg: {
    fontSize: 18,
    lineHeight: 22,
  },
});
