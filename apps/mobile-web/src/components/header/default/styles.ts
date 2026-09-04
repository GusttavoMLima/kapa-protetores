import { StyleSheet } from 'react-native';
import { palette } from '@/theme';

export const defaultHeaderStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: palette.cream,
  },
  logo: {},
  bellWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 40,
    height: 40,
  },
  bellHover: {
    backgroundColor: palette.peach,
    borderRadius: 20,
  },
  counter: {
    textAlign: 'center',
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: palette.orange,
    color: '#f7f7f7',
    fontSize: 10,
    fontWeight: 'bold',
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: 'hidden',
    lineHeight: 16,
  },
});
