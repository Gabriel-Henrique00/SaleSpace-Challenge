/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['<rootDir>/src/**/*.spec.ts'],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
};