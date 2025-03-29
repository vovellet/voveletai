import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: './tsconfig.json',
    }],
  },
  moduleNameMapper: {
    '^@vovelet/vove-engine$': '<rootDir>/__mocks__/@vovelet/vove-engine',
    '^@vovelet/nft-engine$': '<rootDir>/__mocks__/@vovelet/nft-engine',
    '^@vovelet/vcore$': '<rootDir>/__mocks__/@vovelet/vcore',
    '^@vovelet/shared$': '<rootDir>/__mocks__/@vovelet/shared',
    // Include generic pattern for any other @vovelet/* packages
    '^@vovelet/(.*)$': '<rootDir>/__mocks__/@vovelet/$1'
  },
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverageFrom: [
    '**/src/**/*.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/vendor/**',
    '!**/tests/setup.ts',
    '!**/__mocks__/**'
  ],
  coverageDirectory: './coverage',
  verbose: true,
  resetMocks: false,
  // Auto mocks
  automock: false,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  // Manual mocks
  modulePathIgnorePatterns: ['<rootDir>/node_modules/'],
  testPathIgnorePatterns: ['/node_modules/'],
  roots: ['<rootDir>'],
  // Set timeout for tests
  testTimeout: 30000
};

export default config;