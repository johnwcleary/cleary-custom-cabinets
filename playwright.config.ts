import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './scripts',
  testMatch: 'smoke.spec.ts',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4398' },
  webServer: {
    command: 'node scripts/serve.ts 4398',
    url: 'http://127.0.0.1:4398',
    reuseExistingServer: false,
  },
});
