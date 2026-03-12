import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: ['**/*.spec.ts'],
  // WordPress 共用 DB session，必須單 worker 循序執行
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  use: {
    baseURL: 'http://localhost:8891',
    storageState: '.auth/admin.json',
    extraHTTPHeaders: {
      // 預設不帶 Nonce，各測試透過 getNonce() 動態取得
      'X-WP-Nonce': '',
    },
    trace: 'on-first-retry',
  },
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  projects: [
    {
      name: 'api-tests',
      testDir: '.',
      testMatch: ['**/*.spec.ts'],
    },
  ],
})
