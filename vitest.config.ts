import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['server/**/*.spec.ts'],
    globals: true,
    threads: false,
    testTimeout: 30000,
  },
});
