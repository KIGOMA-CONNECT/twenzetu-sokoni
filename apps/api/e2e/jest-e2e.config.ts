import type { Config } from 'jest';
import { resolve } from 'path';

const PROJECT_ROOT = process.cwd();

const config: Config = {
  displayName: 'e2e',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', {
      tsconfig: resolve(PROJECT_ROOT, 'apps/api/e2e/tsconfig.e2e.json'),
      diagnostics: false,
    }],
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@afri-market/kernel$': resolve(PROJECT_ROOT, 'libs/kernel/src/index.ts'),
    '^@afri-market/marketplace-domain$': resolve(PROJECT_ROOT, 'libs/marketplace/domain/src/index.ts'),
    '^@afri-market/marketplace-application$': resolve(PROJECT_ROOT, 'libs/marketplace/application/src/index.ts'),
    '^@afri-market/marketplace-infrastructure$': resolve(PROJECT_ROOT, 'libs/marketplace/infrastructure/src/index.ts'),
    '^@afri-market/marketplace-api$': resolve(PROJECT_ROOT, 'libs/marketplace/api/src/index.ts'),
    '^@afri-market/identity-domain$': resolve(PROJECT_ROOT, 'libs/identity/domain/src/index.ts'),
    '^@afri-market/identity-infrastructure$': resolve(PROJECT_ROOT, 'libs/identity/infrastructure/src/index.ts'),
    '^@afri-market/identity-api$': resolve(PROJECT_ROOT, 'libs/identity/api/src/index.ts'),
    '^@afri-market/integrations$': resolve(PROJECT_ROOT, 'libs/integrations/src/index.ts'),
    '^@afri-market/core-config$': resolve(PROJECT_ROOT, 'libs/core/config/src/index.ts'),
    '^@afri-market/core-http$': resolve(PROJECT_ROOT, 'libs/core/http/src/index.ts'),
    '^@afri-market/core-exceptions$': resolve(PROJECT_ROOT, 'libs/core/exceptions/src/index.ts'),
    '^@afri-market/core-logger$': resolve(PROJECT_ROOT, 'libs/core/logger/src/index.ts'),
    '^@afri-market/core-security$': resolve(PROJECT_ROOT, 'libs/core/security/src/index.ts'),
    '^@afri-market/database$': resolve(PROJECT_ROOT, 'libs/database/src/index.ts'),
    '^@afri-market/tenancy$': resolve(PROJECT_ROOT, 'libs/tenancy/src/index.ts'),
  },
  testMatch: ['**/*.e2e-spec.ts'],
  coverageDirectory: resolve(PROJECT_ROOT, 'coverage/apps/api/e2e'),
};

export default config;
