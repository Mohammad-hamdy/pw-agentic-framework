import { defineConfig, PlaywrightTestConfig } from '@playwright/test';

// Must be set BEFORE the base config is loaded: it reads HEADED at module load
// time to choose between a maximized window and a fixed headless viewport.
// `import` statements are hoisted, so the base config is pulled in with require()
// after this assignment rather than with a top-level import.
process.env.HEADED = '1';
// Default pace for the live runner; SLOWMO from the shell still wins.
process.env.SLOWMO = process.env.SLOWMO || '800';

const baseConfig: PlaywrightTestConfig = require('./playwright.config').default;

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
  },
  // `projects` is inherited from baseConfig via the spread above, so the desktop
  // project keeps its --start-maximized args and slowMo (both set from HEADED /
  // SLOWMO, which are assigned before the base config is loaded).
});
