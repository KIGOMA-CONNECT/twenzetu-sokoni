import type { Config } from 'jest';

const config: Config = {
  displayName: 'marketplace-application',
  preset: '../../../jest.preset.js',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json', diagnostics: false }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@afri-market/kernel$': '<rootDir>/../../kernel/src/index.ts',
    '^@afri-market/core-logger$': '<rootDir>/../../core/logger/src/index.ts',
    '^@afri-market/marketplace-domain$': '<rootDir>/../domain/src/index.ts',
    '^@afri-market/integrations$': '<rootDir>/../../integrations/src/index.ts',
  },
  testMatch: ['**/*.spec.ts'],
  coverageDirectory: '../../../coverage/libs/marketplace/application',
};

export default config;
