require('dotenv').config({ path: '.env.local' });
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // if you have a setup file
  moduleDirectories: ['node_modules', '<rootDir>/'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you soon)
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/containers/(.*)$': '<rootDir>/containers/$1',
    '^@/hooks/(.*)$': '<rootDir>/hooks/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '^@/context/(.*)$': '<rootDir>/context/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1', // If you need to test things in app dir
  },
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'containers/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    'utils/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'context/**/*.{ts,tsx}', // Added context
    'app/**/*.{ts,tsx}', // Added app directory, refine as needed
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!<rootDir>/*.config.js', // Exclude config files
    '!<rootDir>/coverage/**',
    '!<rootDir>/reports/**',
    '!<rootDir>/scripts/**',
    '!<rootDir>/public/**',
    '!<rootDir>/app/api/**', // Exclude API routes from client-side test coverage
  ],
  coverageThreshold: {},
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/.next/'],
  transform: {
    // Use babel-jest to transpile tests with the next/babel preset
    // https://jestjs.io/docs/configuration#transform-objectstring-pathtotransformer--pathtotransformer-object
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  transformIgnorePatterns: [
    '/node_modules/',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
