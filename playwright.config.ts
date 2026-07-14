import { defineConfig, devices } from '@playwright/test';
import configModule from '@config/config';

const { loadConfig } = configModule;
loadConfig();

const platformType = process.env.PLATFORM_TYPE || 'desktop';

const platformConfigurations: any[] = [];

if (platformType === 'mobile') {
  platformConfigurations.push(
    {
      name: 'iPhone 14 Pro Mobile',
      use: {
        browserName: 'webkit',
        viewport: { width: 390, height: 844 },
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'Samsung Galaxy S20 Mobile',
      use: {
        browserName: 'chromium',
        viewport: { width: 360, height: 800 },
        isMobile: true,
        hasTouch: true,
      },
    }
  );
} else if (platformType === 'both') {
  platformConfigurations.push(
    {
      name: 'Chromium Desktop',
      use: {
        permissions: ['clipboard-read', 'clipboard-write'],
        browserName: 'chromium',
        viewport: { width: 1280, height: 720 },
        isMobile: false,
      },
    },
    {
      name: 'Webkit Desktop',
      use: { ...devices['Desktop Safari'] },
    }
  );
} else {
  // default: desktop
  platformConfigurations.push({
    name: 'Chromium Desktop',
    use: {
      permissions: ['clipboard-read', 'clipboard-write'],
      browserName: 'chromium',
      viewport: { width: 1280, height: 720 },
      isMobile: false,
    },
  });
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // The shared test.osool.cloud env is slow under concurrency; one retry absorbs
  // that external flakiness without weakening assertions (a test must still pass).
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? Number(process.env.WORKERS || 1) : 2,
  timeout: 60 * 1000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/e2e-junit-results.xml' }],
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results',
        detail: true,
        suiteTitle: true,
        environmentInfo: {
          Environment: process.env.ENV || 'testing',
          Language: process.env.LANGUAGE || 'en',
          Platform: platformType,
          BaseURL: process.env.BASE_URL || '(fixture)',
        },
      },
    ],
  ],
  use: {
    headless: true,
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: platformConfigurations,
});
