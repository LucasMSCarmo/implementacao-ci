import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/integration/**/*.int.test.ts'],
    globalSetup: ['tests/integration/global-setup.ts'],
    fileParallelism: false,
    testTimeout: 15000,
  },
});
