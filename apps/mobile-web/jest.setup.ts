// Setup file for Jest in apps/mobile-web
// Expo and React Native standard mocks are automatically loaded by jest-expo

// Mock AsyncStorage using the official mock implementation
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
