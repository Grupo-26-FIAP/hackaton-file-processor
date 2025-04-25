module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  testRegex: '.spec.ts$',
  transform: {
    '^.+\\.(t|j)s$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
      },
    ],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  coverageDirectory: './coverage',
  testTimeout: 30000,
  setupFilesAfterEnv: ['<rootDir>/test/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.module.ts',
    '!src/**/*.entity.ts',
    '!src/**/*.dto.ts',
    '!src/main.ts',
    '!src/config/**/*',
    '!src/database/migrations/**/*',
    '!test/**/*',
    '!**/node_modules/**',
  ],
  coveragePathIgnorePatterns: [
    'node_modules',
    'test',
    'src/config',
    'src/database/migrations',
    '.module.ts',
    'main.ts',
  ],
};
