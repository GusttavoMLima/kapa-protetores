/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  rootDir: '../..',
  testEnvironment: 'node',
  roots: ['<rootDir>/apps/server/test'],
  testMatch: ['**/*.spec.ts', '**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  clearMocks: true,
  restoreMocks: true,
  watchman: false,
  moduleNameMapper: {
    '^@kapa/shared$': '<rootDir>/packages/shared/src',
    '^@kapa/shared/(.*)$': '<rootDir>/packages/shared/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/apps/server/tsconfig.test.json',
      },
    ],
  },
};
