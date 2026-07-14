---
name: playwright-cli
description: >-
  How to drive the Playwright command-line tools in this framework — install
  browsers, run tests by tag/title, record locators with codegen, and inspect
  failures with the trace viewer. Read this before running or debugging tests.
---

# Playwright CLI usage

All commands run from the repo root. npm scripts wrap the common ones (`npm test`,
`npm run test:smoke`, `npm run report`, `npm run codegen`, `npm run trace`).

## Watch tests run live (open a real browser)
```bash
npm run test:live      # BEST for watching: headed, one test at a time, slowed down
npm run ui             # Playwright UI Mode: pick/run/watch tests, time-travel each step
npm run test:headed    # visible browser at full speed
npm run test:debug     # headed + Playwright Inspector, step through
# scope to one spec (append after --):
npm run test:live -- tests/ui/login.spec.ts
SLOWMO=1200 npm run test:live -- tests/ui/login.spec.ts   # slower (ms per action)
```
`test:live` uses `playwright.live.config.ts` (headed + `slowMo`, workers: 1) so you
can actually follow each action. `--ui` / `--headed` / `--debug` override
`use.headless: true` from playwright.config.ts.

## First-time setup
```bash
npm install
npx playwright install           # download browsers
npx playwright install --with-deps   # CI / Linux (also installs OS deps)
```

## Running tests
```bash
npx playwright test                          # everything
npx playwright test tests/ui/login.spec.ts   # one file
npx playwright test --grep @smoke            # by tag (tags live in utils/tags)
npx playwright test -g "validate that the user can login"   # by title
npx playwright test --headed                 # watch it run
npx playwright test --debug                  # step through with Inspector
npx playwright test --project="Chromium Desktop"
```
Set the environment first (PowerShell): `$env:ENV="testing"; $env:PLATFORM_TYPE="desktop"`.
Bash: `ENV=testing PLATFORM_TYPE=desktop npx playwright test`.

## codegen — locator discovery aid
```bash
npx playwright codegen https://your-app.example.com
```
Use it to discover stable locators and confirm flows. **Do not commit codegen
output as a test** — refactor it into a Page Object per the `pom-conventions` and
`locator-strategy` skills.

## Type-check before running
```bash
npx playwright test --list   # verify specs compile & are discovered
npx tsc --noEmit             # full TypeScript check (path aliases)
```

## Inspecting failures (for the healer)
```bash
npx playwright test <spec> --trace on   # force a trace
npx playwright show-trace test-results/<...>/trace.zip
npx playwright show-report              # open the HTML report
```
Traces, videos and screenshots are retained on failure (see playwright.config.ts).

## Allure reporting
The `allure-playwright` reporter (configured in playwright.config.ts) writes raw
results to `allure-results/` on every run. Turn them into the rich HTML report with
the bundled `allure-commandline` (needs Java, already present):
```bash
npm test                     # (or any test run) -> populates allure-results/
npm run allure:generate      # build allure-report/ from allure-results/
npm run allure:open          # open the generated report
npm run allure:serve         # one-shot: generate + open a temp server
npm run test:allure          # run the full suite, then generate the report
```
The report auto-captures the environment (ENV, LANGUAGE, PLATFORM_TYPE, BASE_URL),
maps test tags (`@smoke`, `@login`, `@p0`, …) to Allure tags, and attaches the
Playwright screenshot / video / trace on failure. Both `allure-results/` and
`allure-report/` are git-ignored.

## Playwright MCP vs CLI
- The **Playwright MCP** (configured in `.mcp.json`) is for *interactive
  exploration* during planning — navigate, snapshot, inspect the DOM.
- The **CLI** is for *running and debugging* the generated specs.
