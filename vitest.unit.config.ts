import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts', 'src/migrate.ts', 'src/db.ts', 'src/tasks/pg-repository.ts'],
      reporter: ['text', 'html', 'json-summary'],
      thresholds: { lines: 80, functions: 80, branches: 75 },
    },
  },
});
