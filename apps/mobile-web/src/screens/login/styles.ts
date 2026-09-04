import { palette, typography } from '@/theme';
import { StyleSheet } from 'react-native';

export const loginScreenStyles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: palette.cream,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 32
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 'auto',
    gap:16
  },
  headerTitle: {
    ...typography['styles']['headlineXl'],
  },
  headerText: {
    ...typography['styles']['bodyMd'],
    textAlign: 'center',
    width: 280,
    color: palette.inkSecondary
  },
});
