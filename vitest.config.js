import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environmentMatchGlobs: [
      ['tests/ratings.test.js', 'jsdom'],
      ['tests/server.test.js', 'node'],
    ],
  },
});
