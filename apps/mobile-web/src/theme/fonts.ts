// theme/typography.ts
import { TextStyle } from 'react-native';

type TypographyVariant =
  | 'headlineXl'
  | 'headlineLg'
  | 'headlineLgMobile'
  | 'headlineMd'
  | 'bodyLg'
  | 'bodyMd'
  | 'bodySm'
  | 'bodyXs'
  | 'labelMd'
  | 'labelSm';

export type TypographyConfig = {
  fonts: {
    heading: string;
    body: string;
  };
  styles: Record<TypographyVariant, TextStyle>;
};

export const typography: TypographyConfig = {
  fonts: {
    heading: 'BeVietnamPro-Bold',
    body: 'PlusJakartaSans-Regular',
  },
  styles: {
    headlineXl: {
      fontFamily: 'BeVietnamPro-Bold',
      fontSize: 36,
      fontWeight: '700',
      lineHeight: 44,
      letterSpacing: -0.72,
    },
    headlineLg: {
      fontFamily: 'BeVietnamPro-Bold',
      fontSize: 28,
      fontWeight: '700',
      lineHeight: 34,
      letterSpacing: -0.28,
    },
    headlineLgMobile: {
      fontFamily: 'BeVietnamPro-Bold',
      fontSize: 24,
      fontWeight: '700',
      lineHeight: 30,
    },
    headlineMd: {
      fontFamily: 'BeVietnamPro-Medium',
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    },
    bodyLg: {
      fontFamily: 'PlusJakartaSans-Regular',
      fontSize: 18,
      fontWeight: '400',
      lineHeight: 28,
    },
    bodyMd: {
      fontFamily: 'PlusJakartaSans-Regular',
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
    },
    bodySm: {
      fontFamily: 'PlusJakartaSans-Regular',
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
    },
    bodyXs: {
      fontFamily: 'PlusJakartaSans-Regular',
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
    },
    labelMd: {
      fontFamily: 'PlusJakartaSans-Medium',
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 16,
      letterSpacing: 0.28,
    },
    labelSm: {
      fontFamily: 'PlusJakartaSans-Medium',
      fontSize: 12,
      fontWeight: '600',
      lineHeight: 14,
    },
  },
};
