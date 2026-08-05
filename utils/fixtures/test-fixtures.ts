import { test as base, expect, Page } from '@playwright/test';

/**
 * Shared test fixtures.
 *
 * Playwright already disposes the context (and therefore the page) after each
 * test, so specs never leaked browsers. What this adds is a deterministic,
 * observable teardown: the page and its context are closed explicitly as soon as
 * the test body finishes, instead of at whatever point the runner reclaims them.
 *
 * That matters for the headed / maximized run, where a real OS window would
 * otherwise linger on screen after the last assertion, and for long suites where
 * closing early frees the browser's memory between tests.
 *
 * Specs opt in by importing `test` from here instead of from '@playwright/test'.
 */
export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use, testInfo) => {
    // --- test body runs here ---
    await use(page);

    // --- teardown ---
    // Video/trace attachments are finalized on context close, so closing the
    // page first and the context second preserves failure artifacts.
    // Everything is best-effort: a teardown error must never mask the real
    // assertion failure that a test just reported.
    try {
      if (!page.isClosed()) {
        await page.close();
      }
      await page.context().close();
    } catch (error: any) {
      console.log(
        `[teardown] closing the browser context failed for "${testInfo.title}": ${error.message}`
      );
    }
  },
});

export { expect };
