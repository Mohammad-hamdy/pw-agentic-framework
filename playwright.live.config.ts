import { defineConfig } from '@playwright/test';
import baseConfig from './playwright.config';

/**
 * Live / demo runner — opens a real (headed) browser and slows each action down
 * so you can watch the test drive the app. Runs one test at a time.
 *
 * Usage:
 *   npm run test:live                                  # whole suite, watchable
 *   npm run test:live -- tests/ui/login.spec.ts        # one spec
 *   SLOWMO=1200 npm run test:live -- tests/ui/login.spec.ts   # slower (ms/action)
 *
 * Tune the pace with the SLOWMO env var (milliseconds between actions; default 800).
 */
export default defineConfig({
  ...baseConfig,
  workers: 1,
  fullyParallel: false,
  retries: 0,
  use: {
    ...baseConfig.use,
    headless: false,
    launchOptions: {
      slowMo: Number(process.env.SLOWMO || 800),
    },
  },
});
