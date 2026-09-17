import { StyleSheet } from 'react-native';
import { palette, typography } from '@/theme';

export const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  body: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  scroll: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 20,
  },
  header: {
    paddingTop: 18,
    gap: 6,
  },
  title: {
    ...typography.styles.headlineLgMobile,
    color: palette.ink,
  },
  subtitle: {
    ...typography.styles.bodyMd,
    color: palette.inkMuted,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.line,
    padding: 16,
    gap: 12,
    shadowColor: palette.orangeDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  section: {
    ...typography.styles.headlineMd,
    color: palette.orangeDark,
  },
  fieldLabel: {
    ...typography.styles.labelMd,
    color: palette.ink,
  },
  doseGroup: {
    gap: 8,
    paddingVertical: 4,
  },
  doseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  removeDose: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  removeDoseText: {
    ...typography.styles.labelSm,
    color: palette.danger,
  },
  feedback: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 4,
  },
  feedbackError: {
    backgroundColor: palette.dangerSoft,
    borderColor: palette.danger,
  },
  feedbackSuccess: {
    backgroundColor: '#E8F3EE',
    borderColor: palette.success,
  },
  feedbackErrorText: {
    ...typography.styles.bodySm,
    color: palette.danger,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  feedbackSuccessText: {
    ...typography.styles.bodySm,
    color: palette.success,
    fontFamily: 'PlusJakartaSans-Medium',
  },
});
