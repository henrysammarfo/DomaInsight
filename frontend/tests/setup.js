// Jest setup file for E2E tests
const { toMatchImageSnapshot } = require('jest-image-snapshot');

// Extend Jest matchers
expect.extend({ toMatchImageSnapshot });

// Global test configuration
beforeAll(async () => {
  // Set up global test configuration
  process.env.NODE_ENV = 'test';
});

afterAll(async () => {
  // Cleanup after all tests
  process.env.NODE_ENV = 'development';
});

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Increase timeout for E2E tests
jest.setTimeout(30000);
