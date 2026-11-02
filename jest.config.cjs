module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  clearMocks: true,
  reporters: ['default', '<rootDir>/tests/component-results-reporter.cjs'],
  collectCoverageFrom: [
    'components/**/*.{js,jsx}',
    'screens/**/*.{js,jsx}',
    'context/**/*.js',
    'hooks/**/*.js',
    'services/**/*.js',
    'storage/**/*.js',
    'navigation/**/*.js',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'html', 'lcov', 'json-summary'],
};
