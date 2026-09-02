export const palette = {
  orange: '#F18322', // Zesty Orange (Primary actions)
  orangeDark: '#D97A00', // Hover state
  denim: '#2A4E75', // Deep Denim (Secondary / Nav)
  cream: '#FFFBF7', // Surface Cream (Soft background)
  peach: '#FFE7DB', // Soft Peach (Containers / Tags)
  white: '#FFFFFF', // Cards / Modals
  ink: '#1C1C19', // Dark text
  inkMuted: '#58423b', // Secondary text / outline variants
  inkSecondary: '#57423B',
  danger: '#BA1A1A', // Error states
  success: '#2F6F5E', // Success states
  line: '#F0E4D4',
  card: '#FFFFFF',
  dangerSoft: '#FDECEA',
} as const;

export const colors = {
  primary: palette.orange,
  onPrimary: palette.white,
  secondary: palette.denim,
  onSecondary: palette.white,
  error: palette.danger,
  onError: palette.white,

  background: palette.cream,
  onBackground: palette.ink,
  surface: palette.cream,
  onSurface: palette.ink,
  surfaceVariant: '#E5E2DE',
  onSurfaceVariant: palette.inkMuted,

  primaryContainer: '#AD5800',
  onPrimaryContainer: '#FFF1E9',
  secondaryContainer: '#AFD1FF',
  onSecondaryContainer: '#375A82',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#93000A',

  secondaryInpuText: {
    backgroundColor: '#F6F3EE',
    borderColor: '#E5E2DD',
    placeholderColor: '#57423B60',
  },

  card: palette.white,
  tagBackground: palette.peach,
  tagText: palette.denim,
  border: '#8B716A',
  borderMuted: '#DFC0B7',
} as const;
