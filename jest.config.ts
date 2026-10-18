import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Only run tests under the tests/ directory
  testMatch: ['<rootDir>/tests/**/*.test.ts'],
  moduleNameMapper: {
    // Resolve @/ path aliases the same way Next.js does
    '^@/(.*)$': '<rootDir>/src/$1',
    // Use pure-JS in-memory mock instead of native addon
    '^better-sqlite3$': '<rootDir>/__mocks__/better-sqlite3.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        // CommonJS compatible for Jest
        module: 'CommonJS',
        esModuleInterop: true,
      },
    }],
  },
  // Ensure mock files are transformed too
  transformIgnorePatterns: ['/node_modules/'],
};

export default config;
