import { StyleSheet } from 'react-native';
import { palette, typography } from '@/theme';

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  content: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 20,
  },
  hero: {
    alignItems: 'center',
    gap: 8,
    paddingBottom: 4,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: palette.peach,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    ...typography.styles.headlineLgMobile,
    color: palette.ink,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.styles.bodyMd,
    color: palette.inkMuted,
    textAlign: 'center',
    maxWidth: 330,
  },
  card: {
    backgroundColor: palette.white,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: palette.line,
  },
  section: {
    ...typography.styles.headlineMd,
    color: palette.denim,
  },
  fieldLabel: {
    ...typography.styles.labelMd,
    color: palette.inkMuted,
    marginTop: 2,
  },
  privacy: {
    ...typography.styles.bodySm,
    color: palette.inkMuted,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  feedback: {
    backgroundColor: '#E8F3EE',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.success,
  },
  feedbackError: {
    backgroundColor: palette.dangerSoft,
    borderColor: palette.danger,
  },
  feedbackText: {
    ...typography.styles.bodySm,
    color: palette.success,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  feedbackErrorText: {
    color: palette.danger,
  },
});
