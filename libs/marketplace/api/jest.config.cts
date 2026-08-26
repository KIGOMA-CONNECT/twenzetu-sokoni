const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');

module.exports = {
  displayName: 'marketplace-api',
  preset: '../../../jest.preset.js',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json', diagnostics: false }],
  },
  moduleFileExtensions: ['ts', 'js'],
  moduleNameMapper: {
    '^@afri-market/kernel$': path.join(ROOT, 'libs/kernel/src/index.ts'),
    '^@afri-market/marketplace-domain$': path.join(ROOT, 'libs/marketplace/domain/src/index.ts'),
    '^@afri-market/marketplace-application$': path.join(ROOT, 'libs/marketplace/application/src/index.ts'),
    '^@afri-market/marketplace-infrastructure$': path.join(ROOT, 'libs/marketplace/infrastructure/src/index.ts'),
    '^@afri-market/marketplace-api$': path.join(ROOT, 'libs/marketplace/api/src/index.ts'),
    '^@afri-market/identity-domain$': path.join(ROOT, 'libs/identity/domain/src/index.ts'),
    '^@afri-market/identity-infrastructure$': path.join(ROOT, 'libs/identity/infrastructure/src/index.ts'),
    '^@afri-market/integrations$': path.join(ROOT, 'libs/integrations/src/index.ts'),
    '^@afri-market/core-security$': path.join(ROOT, 'libs/core/security/src/index.ts'),
    '^@afri-market/core-config$': path.join(ROOT, 'libs/core/config/src/index.ts'),
    '^@afri-market/core-http$': path.join(ROOT, 'libs/core/http/src/index.ts'),
    '^@afri-market/core-exceptions$': path.join(ROOT, 'libs/core/exceptions/src/index.ts'),
    '^@afri-market/core-logger$': path.join(ROOT, 'libs/core/logger/src/index.ts'),
    '^@afri-market/database$': path.join(ROOT, 'libs/database/src/index.ts'),
    '^@afri-market/tenancy$': path.join(ROOT, 'libs/tenancy/src/index.ts'),
    '^@afri-market/core-finance$': path.join(ROOT, 'libs/core-finance/src/index.ts'),
  },
  testMatch: ['**/*.spec.ts'],
  testPathIgnorePatterns: ['/node_modules/', '__tests__/'],
  coverageDirectory: '../../../coverage/libs/marketplace/api',
};
