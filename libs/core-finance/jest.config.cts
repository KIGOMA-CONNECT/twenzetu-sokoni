import * as path from 'path';

const ROOT = path.resolve(__dirname, '../..');

module.exports = {
  displayName: 'core-finance',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json', diagnostics: false }],
  },
  moduleFileExtensions: ['ts', 'js', 'json', 'html'],
  moduleNameMapper: {
    '^@afri-market/core-logger$': path.join(ROOT, 'libs/core/logger/src/index.ts'),
    '^@afri-market/core-config$': path.join(ROOT, 'libs/core/config/src/index.ts'),
    '^@afri-market/database$': path.join(ROOT, 'libs/database/src/index.ts'),
  },
  testMatch: ['**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '__tests__/'],
  coverageDirectory: '../../../coverage/libs/core-finance',
};