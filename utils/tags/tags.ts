/**
 * Central registry of test tags. Reference these constants in test metadata
 * instead of hardcoding strings, so tag renames stay in one place.
 *
 * Run a subset with:  npx playwright test --grep @smoke
 */
export const TAGS = {
  // Test type
  smoke: '@smoke',
  regression: '@regression',
  sanity: '@sanity',

  // Priority
  p0: '@p0',
  p1: '@p1',
  p2: '@p2',
  critical: '@critical',
  high: '@high',
  medium: '@medium',
  low: '@low',

  // Cross-functional
  api: '@api',
  ui: '@ui',
  accessibility: '@accessibility',
  performance: '@performance',
  security: '@security',

  // Lifecycle / status
  wip: '@wip',
  flaky: '@flaky',
  featureNotReady: '@featureNotReady',

  // Feature (extend per project)
  login: '@login',
  search: '@search',
  checkout: '@checkout',
} as const;

export type Tag = (typeof TAGS)[keyof typeof TAGS];
