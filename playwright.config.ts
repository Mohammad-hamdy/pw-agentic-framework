import { defineConfig, devices } from '@playwright/test';
import configModule from '@config/config';

const { loadConfig, config } = configModule;
loadConfig();

const platformType = process.env.PLATFORM_TYPE || 'desktop';

// Playwright runs headless by default; `--headed`, HEADED=1, or the live runner
// (playwright.live.config.ts, which sets HEADED=1) opens a real window.
const isHeaded = process.env.HEADED === '1' || process.argv.includes('--headed');

/**
 * Reads the primary monitor's usable work area (excludes the taskbar) so the
 * browser is sized to THIS machine's screen rather than a hardcoded resolution.
 * Falls back to 1280x720 — Playwright's own default — if detection fails
 * (headless CI agents, non-Windows hosts, PowerShell unavailable).
 */
function detectScreenSize(): { width: number; height: number } {
  const fallback = { width: 1280, height: 720 };
  if (process.platform !== 'win32') return fallback;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { execSync } = require('child_process');
    const out = execSync(
      'powershell -NoProfile -NonInteractive -Command "Add-Type -AssemblyName System.Windows.Forms; $a=[System.Windows.Forms.Screen]::PrimaryScreen.WorkingArea; Write-Output ($a.Width.ToString() + \'x\' + $a.Height.ToString())"',
      { encoding: 'utf8', timeout: 10_000, stdio: ['ignore', 'pipe', 'ignore'] }
    );
    const match = String(out).trim().match(/(\d+)x(\d+)/);
    if (!match) return fallback;
    const width = Number(match[1]);
    const height = Number(match[2]);
    return width > 0 && height > 0 ? { width, height } : fallback;
  } catch {
    return fallback;
  }
}

// Explicit overrides win; otherwise use the real screen. Detection runs once at
// config load, not per test.
const screen =
  process.env.VIEWPORT_WIDTH && process.env.VIEWPORT_HEIGHT
    ? {
        width: Number(process.env.VIEWPORT_WIDTH),
        height: Number(process.env.VIEWPORT_HEIGHT),
      }
    : detectScreenSize();

/**
 * Desktop browser sizing.
 *
 * Headed: `--start-maximized` fills the real screen, and `viewport: null` is
 * REQUIRED for it to have any effect — with a fixed viewport Playwright renders
 * at that size regardless of how large the window is.
 *
 * Headless: there is no window manager, so `--start-maximized` is a no-op. The
 * viewport is set to the detected screen work area instead, so headless and
 * headed runs lay out the same and screenshots/videos match what you see.
 * Override with VIEWPORT_WIDTH / VIEWPORT_HEIGHT (e.g. a fixed size in CI).
 */
const maximizedDesktop = isHeaded
  ? {
      viewport: null,
      // slowMo lives here too so the live runner does not have to replace this
      // object (which would drop --start-maximized). Default 0 = full speed.
      launchOptions: {
        args: ['--start-maximized'],
        slowMo: Number(process.env.SLOWMO || 0),
      },
    }
  : {
      viewport: { width: screen.width, height: screen.height },
    };

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
        ...maximizedDesktop,
        isMobile: false,
      },
    },
    {
      name: 'Webkit Desktop',
      // WebKit runs roughly 2x slower than Chromium against this app: the
      // create+search+delete path measured 56s end-to-end (ar), leaving only ~4s
      // of the default 60s budget — which parallel load then exhausted. The
      // steps themselves are healthy, so the budget is what needed correcting.
      timeout: Number(process.env.WEBKIT_TIMEOUT || 120_000),
      // Desktop Safari carries its own 1280x720 viewport — resize it to match
      // the Chromium desktop project. (--start-maximized is Chromium-only, so
      // WebKit uses the detected screen size in both headed and headless runs.)
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: screen.width, height: screen.height },
      },
    }
  );
} else {
  // default: desktop
  platformConfigurations.push({
    name: 'Chromium Desktop',
    use: {
      permissions: ['clipboard-read', 'clipboard-write'],
      browserName: 'chromium',
      ...maximizedDesktop,
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
  // Default per-test budget (Chromium desktop finishes its slowest test in ~40s).
  // WebKit gets a larger budget via its own project entry — see WEBKIT_TIMEOUT.
  timeout: Number(process.env.TEST_TIMEOUT || 60_000),
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
          BaseURL: config.baseUrl || '(fixture)',
        },
      },
    ],
  ],
  use: {
    // The app origin under test, normalized from BASE_URL. Page Objects pass
    // absolute URLs today; this makes the resolved target visible to the runner
    // (and to `--ui` / trace viewer) instead of it being implicit in the specs.
    baseURL: config.baseUrl,
    headless: true,
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: platformConfigurations,
});
