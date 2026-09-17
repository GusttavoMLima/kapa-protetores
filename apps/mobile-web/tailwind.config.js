/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './apps/mobile-web/app/**/*.{js,jsx,ts,tsx}',
    './apps/mobile-web/src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        orange: {
          DEFAULT: '#F18322',
          light: '#FFE7DB',
          dark: '#D97A00',
        },
        denim: {
          DEFAULT: '#2A4E75',
          light: '#4A6E95',
          dark: '#1A3E65',
        },
        cream: {
          DEFAULT: '#FFFBF7',
          dark: '#F5EFE6',
        },
        peach: '#FFE7DB',
        ink: {
          DEFAULT: '#1C1C19',
          muted: '#58423b',
          light: '#A39B8E',
        },
        border: '#E5E2DD',
        danger: {
          DEFAULT: '#BA1A1A',
          soft: '#FDECEA',
        },
        success: {
          DEFAULT: '#2F6F5E',
          soft: '#EBF5F0',
        },
        line: '#F0E4D4',
        card: '#FFFFFF',
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        'full': '9999px',
      },
      fontFamily: {
        // Be Vietnam Pro (Headlines - DESIGN.md)
        vietnam: ['BeVietnamPro-Regular'],
        'vietnam-medium': ['BeVietnamPro-Medium'],
        'vietnam-bold': ['BeVietnamPro-Bold'],
        'vietnam-extrabold': ['BeVietnamPro-ExtraBold'],
        // Plus Jakarta Sans (Body & Labels - DESIGN.md)
        jakarta: ['PlusJakartaSans-Regular'],
        'jakarta-light': ['PlusJakartaSans-Light'],
        'jakarta-medium': ['PlusJakartaSans-Medium'],
      },
    },
  },
  plugins: [],
};
