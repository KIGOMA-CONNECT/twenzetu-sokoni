module.exports = {
  displayName: 'hr-succession-infrastructure-integration',
  preset: '../../../../jest.preset.js',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/**/*.integration-spec.ts'],
  setupFiles: ['<rootDir>/src/test-integration-setup.ts'],
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../../../coverage/libs/hr-succession-infrastructure-integration',
};
