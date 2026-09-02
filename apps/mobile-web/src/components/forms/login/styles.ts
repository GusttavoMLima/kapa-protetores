import { StyleSheet } from 'react-native';
import { palette, typography } from '@/theme';

export const loginFormStyles = StyleSheet.create({
  container: {
    padding: 16,
  },
  form: {
    display: 'flex',
    alignItems: 'center',
    gap: 22,
    width: '100%',
  },
  forget: {
    ...typography['styles']['bodySm'],
    width: '100%',
    fontWeight: 600,
    textAlign: 'right',
    color: palette.orange,
    cursor: 'pointer',
  },
  horizontalRuleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginVertical: 20,
  },
  horizontalRule: {
    flex: 1,
    height: 1,
    borderBottomColor: '#ccc',
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginVertical: 12,
  },
  horizontalRuleText: {
    ...typography['styles']['bodySm'],
    fontWeight: 600,
    color: palette.inkSecondary,
    marginHorizontal: 16,
  },
  signUpText: {
    ...typography.styles.bodyMd,
    textAlign: 'center',
    marginVertical: 28,
    color: palette.inkSecondary,
  },
});
