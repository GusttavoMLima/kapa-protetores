module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^expo-modules-core$': '<rootDir>/../../node_modules/expo/node_modules/expo-modules-core',
    '^expo-modules-core/(.*)$': '<rootDir>/../../node_modules/expo/node_modules/expo-modules-core/$1',
  },
  testMatch: ['<rootDir>/test/**/*.spec.{ts,tsx}'],
  clearMocks: true,
};
