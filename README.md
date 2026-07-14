# Playwright Agentic QE Framework

A Playwright + TypeScript test automation framework that is driven by **Claude Code agents**.

You bring a requirement — a **user story** or a **Jira issue**. Claude explores the real
application through the Playwright MCP, writes an evidence-based test plan, waits for your
approval, generates Page-Object-based specs, runs them, and diagnoses failures. You stay in
control at two approval gates: **before any code is generated**, and **before any healing fix
is applied**.

The framework itself is a normal Playwright project — you can write every test by hand and
never invoke an agent. The agents just do the tedious parts (DOM exploration, boilerplate POM
code, locale extraction) while enforcing the conventions in [CLAUDE.md](CLAUDE.md).

---

## Table of contents

- [Quick start](#quick-start)
- [Running tests](#running-tests)
- [Reports](#reports)
- [The agentic workflow](#the-agentic-workflow)
- [Writing your first test (the manual path)](#writing-your-first-test-the-manual-path)
- [Architecture](#architecture)
- [Conventions you must follow](#conventions-you-must-follow)
- [Configuration & environments](#configuration--environments)
- [MCP setup](#mcp-setup)
- [Project structure](#project-structure)
- [Troubleshooting](#troubleshooting)
- [Housekeeping for the team](#housekeeping-for-the-team)

---

## Quick start

```bash
git clone <repo-url>
cd pw-agentic-framework
npm install
npx playwright install          # download the browsers (one-off)
npm test                        # run the whole suite
```

**Prerequisites**

| Tool | Why | Notes |
|---|---|---|
| Node.js 18+ | Playwright + TypeScript | `@types/node` targets Node 24; 18+ works |
| Java (JRE 8+) on the `PATH` | Allure report generation only | Tests run fine without it |

The bundled example suite ([tests/ui/login.spec.ts](tests/ui/login.spec.ts)) runs against the
**live Osool test environment** (`https://test.osool.cloud`, set as `BASE_URL` in
[config/.env.testing](config/.env.testing)). You need network access to that host for it to
pass. Point `BASE_URL` at your own app to author tests against something else.

---

## Running tests

Every command runs from the repo root.

```bash
npm test                      # whole suite, headless
npm run test:ui               # only tests/ui
npm run test:api              # only tests/api
npm run test:smoke            # only tests tagged @smoke
npm run test:regression       # only tests tagged @regression
npm run typecheck             # tsc --noEmit — run this before you push
```

**Watch a test actually drive the browser** — the fastest way to understand what a spec does:

```bash
npm run test:live                                       # headed, 1 test at a time, slowed down
npm run test:live -- tests/ui/login.spec.ts             # scope to one spec
SLOWMO=1200 npm run test:live -- tests/ui/login.spec.ts # slower still (ms between actions)

npm run ui                    # Playwright UI Mode — time-travel debugger, best for authoring
npm run test:headed           # headed, but full speed and parallel
npm run test:debug            # step through with the Playwright Inspector
```

`test:live` uses [playwright.live.config.ts](playwright.live.config.ts) — headed, `workers: 1`,
`retries: 0`, `slowMo` of 800 ms. Use it in demos and when a test "passes but I don't trust it".

**Filtering:**

```bash
npx playwright test --grep @login                       # by tag
npx playwright test -g "validate that a user can log in" # by title
npx playwright test --project="Chromium Desktop"        # by project
```

**Environment variables** must be set *before* the command:

```powershell
# PowerShell
$env:ENV="testing"; $env:LANGUAGE="ar"; npm test
```
```bash
# Bash
ENV=testing LANGUAGE=ar npm test
```

---

## Reports

Three reporters are wired into every run ([playwright.config.ts](playwright.config.ts)):

- **HTML** — `npm run report` opens the last run.
- **JUnit XML** — `test-results/e2e-junit-results.xml`, for CI ingestion.
- **Allure** — raw results land in `allure-results/` on every run.

```bash
npm run allure:serve          # generate + open in a temp server (quickest)
npm run allure:generate       # build allure-report/
npm run allure:open           # open the built report
npm run test:allure           # run the suite, then generate
```

Allure automatically records `ENV`, `LANGUAGE`, `PLATFORM_TYPE` and `BASE_URL` as environment
info, maps your `@smoke` / `@p0` / `@login` tags to Allure tags, and attaches the
screenshot, video and trace of any failure. Allure needs **Java on the `PATH`**.

On failure the config retains a **video**, a **trace** and a **screenshot**. Open a trace with:

```bash
npx playwright show-trace test-results/<...>/trace.zip
```

---

## The agentic workflow

Open the repo in **VSCode with Claude Code**. Three slash commands drive the whole pipeline:

| Command | Argument | What it does |
|---|---|---|
| `/qe-from-story` | a path (e.g. `stories/example-login.md`) **or** inline story text | Author tests from a user story |
| `/qe-from-jira` | a Jira issue key (e.g. `SCRUM-123`) | Fetch the issue via the Atlassian MCP, then author tests |
| `/qe-heal` | a spec path, a `trace.zip` path, or a test title | Diagnose a failing test and fix it — or report an app bug |

Each authoring command runs the same fixed pipeline:

```
  intake  →  plan  →  ⛔ YOUR APPROVAL  →  generate  →  run  →  heal  →  ⛔ YOUR APPROVAL
 (skill)   (agent)                          (agent)     (CLI)   (agent)
```

**1. Intake** — the [`story-intake`](.claude/skills/story-intake/SKILL.md) skill normalizes the
requirement into a fixed shape: id, title, summary, actors, preconditions, an **atomic** acceptance-criteria
checklist, out-of-scope items, and open questions. Compound ACs get split. If the story has no
ACs, Claude derives candidates and marks them as open questions rather than treating guesses as
agreed requirements. The story/Jira id is preserved here — that's what makes traceability work
downstream.

**2. Plan** — the [`pw-test-planner`](.claude/agents/pw-test-planner.md) agent opens the **live
app** with the Playwright MCP, navigates, snapshots the DOM, and captures the real selectors and
the real localized strings. It writes `specs-plans/<story-slug>.plan.md` and **stops**. It never
writes test code.

Every scenario in the plan is classified:

| Classification | Meaning |
|---|---|
| `VERIFIED` | The agent observed the behavior and the elements in the app |
| `ASSUMPTION_NEEDS_REVIEW` | Plausible but unconfirmed — it says exactly what is unverified and why |
| `REJECTED_UNSUPPORTED` | The app doesn't support what the story asks — with an explanation |

**Read the plan.** This is the gate that matters. Check the `ASSUMPTION_NEEDS_REVIEW` scenarios,
answer the "Open questions for QA", and confirm the proposed locators look stable.
[specs-plans/osool-login.plan.md](specs-plans/osool-login.plan.md) is a real, committed example —
it shows the exact format, including the live-DOM evidence table and the captured en/ar strings.

**3. Generate** — only after you approve, the
[`pw-test-generator`](.claude/agents/pw-test-generator.md) agent implements *exactly* what the
plan describes — no invented scenarios. It creates or extends Page Objects, specs, locale files,
tags and test data, then runs the specs and reports pass/fail. It refuses to start without an
approved plan.

**4. Heal** — when a test fails, the [`pw-test-healer`](.claude/agents/pw-test-healer.md) agent
reproduces it with a trace and classifies the root cause into exactly two buckets:

- **Application issue** — the app is genuinely wrong. It reports a product defect and **does not
  touch the test**.
- **Automation issue** — a stale locator, a missing wait, wrong data, a race. This it fixes, with
  the smallest possible change.

It shows you the diagnosis and the proposed change and **waits for approval** before editing
anything. It will never weaken or delete an assertion to make a test pass.

### The four skills

Claude loads these automatically; read them yourself before writing code by hand.

| Skill | What it governs |
|---|---|
| [`story-intake`](.claude/skills/story-intake/SKILL.md) | Normalizing a story/Jira issue into acceptance criteria |
| [`pom-conventions`](.claude/skills/pom-conventions/SKILL.md) | POM structure, WebUtil, naming, tags, localization, clean code |
| [`locator-strategy`](.claude/skills/locator-strategy/SKILL.md) | Locator priority and the banned patterns |
| [`playwright-cli`](.claude/skills/playwright-cli/SKILL.md) | Running, codegen, traces, Allure |

### Permissions

[.claude/settings.json](.claude/settings.json) pre-approves reading, writing, `npm run *`,
`npx playwright *` and `npx tsc *`, so the agents work without constant prompts. It asks before
`git commit` and `git push` — **nothing is ever committed or pushed without you saying so.**

---

## Writing your first test (the manual path)

You don't need an agent. Here is the whole loop for a new feature — say, a "Projects" page.

**Step 1 — Explore and pick your locators.** Use codegen as a discovery aid:

```bash
npm run codegen https://test.osool.cloud/workspace/projects
```

Never commit codegen output as a test. It's a locator scratchpad; you refactor its findings into
a Page Object.

**Step 2 — Write the Page Object** in `pages/ProjectsPage.ts`. One class per page. Follow the
[mandatory member order](#the-mandatory-page-object-member-order) and route **every** action
through `WebUtil`:

```ts
import { Page, Locator } from '@playwright/test';
import { WebUtil } from '@pages/action-healing/web-util';

class ProjectsPage {
  private page: Page;
  private webUtil: WebUtil;

  // Web elements
  private searchTextField: Locator;
  private createProjectButton: Locator;
  private emptyStateLabel: Locator;

  constructor(page: Page) {
    this.page = page;
    this.webUtil = new WebUtil(page);
    this.searchTextField = page.getByTestId('project-search');
    this.createProjectButton = page.getByTestId('create-project');
    this.emptyStateLabel = page.locator('#projects-empty-state');
  }

  // Fill methods
  async enterSearchTerm(term: string): Promise<void> {
    await this.webUtil.fill(this.searchTextField, term);
  }

  // Click methods
  async clickOnCreateProjectButton(): Promise<void> {
    await this.webUtil.click(this.createProjectButton);
  }

  // Validation methods
  async getEmptyStateText(): Promise<string> {
    return this.webUtil.getText(this.emptyStateLabel);
  }
}

export default ProjectsPage;
```

**Step 3 — Add the strings** to `locales/en/projects.ts` *and* `locales/ar/projects.ts`, with
identical keys. `en` is the fallback — it must always exist.

```ts
// locales/en/projects.ts
export default {
  emptyState: 'No projects yet',
  createButton: 'Create project',
};
```

**Step 4 — Add test data** to [test-data/testing/testData.ts](test-data/testing/testData.ts).
Secrets are **not** stored here — put them in `config/.env.<env>` and read them lazily through a
getter, the way `validUser.password` does.

**Step 5 — Add any new tag** to [utils/tags/tags.ts](utils/tags/tags.ts). Never hardcode
`'@smoke'` in a spec.

**Step 6 — Write the spec** in `tests/ui/projects.spec.ts`. The title carries the case id and
starts with `validate that`:

```ts
import { test, expect } from '@playwright/test';
import ProjectsPage from '@pages/ProjectsPage';
import configModule from '@config/config';
import { TAGS } from '@utils/tags/tags';

const { getLocale, getTestData, config } = configModule;

test.describe(`Projects [${config.language}]`, () => {
  const projects = getLocale('projects');

  test(
    '[SCRUM-123] validate that the empty state is shown when no projects exist',
    { tag: [TAGS.regression, TAGS.ui] },
    async ({ page }) => {
      const projectsPage = new ProjectsPage(page);
      // ... arrange, act
      expect(await projectsPage.getEmptyStateText()).toBe(projects.emptyState);
    }
  );
});
```

**Step 7 — Type-check, then run it.**

```bash
npm run typecheck
npx playwright test --list                    # confirm it compiles and is discovered
npm run test:live -- tests/ui/projects.spec.ts # watch it drive the browser
```

**Step 8 — If it fails**, don't guess. Run `/qe-heal tests/ui/projects.spec.ts` and let the
healer read the trace, or inspect it yourself with `npx playwright show-trace`.

---

## Architecture

### `WebUtil` — the action layer

[pages/action-healing/web-util.ts](pages/action-healing/web-util.ts) wraps Playwright's `Page`.
**Every action in a Page Object goes through it** — `click`, `fill`, `uploadFile`, `check`,
`selectOption`, `hover`, `getText`, `getAttribute`, `isVisible`, `waitForUri`, `scrollToElement`.

It gives you, for free and in one place:

- **Loader handling** — after every action it waits for the app's spinner to disappear. That is
  why you don't scatter `waitForLoadState('networkidle')` through your Page Objects.
- **Step logging** — it derives the calling method name from the stack and logs
  `click on click on login button`, so the trace reads like a test script.
- **Locator-or-string flexibility** — pass a `Locator` or a raw selector string.

> ⚠️ **Configure the loader selector for your app.** `WebUtil`'s `loaderSelector` currently
> defaults to `'[data-testid="loader"], img[alt="loader"]'` and is marked with a `TODO`. If your
> app's spinner is something else, point it there — otherwise the loader waits silently no-op.

Calling `page.click()` / `page.fill()` directly in a Page Object or a spec is **banned**.

### The API layer

Three layers under `api/`, used when a story needs backend setup (seed a user, get a token) or an
API test:

| Layer | Responsibility | Example |
|---|---|---|
| `api/model/` | **Builder** — assemble a request payload fluently, validate it in `build()` | [LoginRequestBuilder.ts](api/model/LoginRequestBuilder.ts) |
| `api/service/` | **Raw HTTP only** — wraps `APIRequestContext`, knows nothing about tests | [AuthService.ts](api/service/AuthService.ts) |
| `api/request-flow/` | **Business workflow** — what a test actually calls | [AuthFlow.ts](api/request-flow/AuthFlow.ts) |

A test calls `new AuthFlow(request, apiUrl).authenticate(user, pass)` and gets a token back. It
never assembles a payload or picks an endpoint itself.

### Path aliases

Import through the aliases, never with deep relative paths. They are declared in **both**
[tsconfig.json](tsconfig.json) (`paths`, for the type-checker) and
[package.json](package.json) (`_moduleAliases`, for runtime resolution) — **add any new alias to
both.**

`@pages` · `@api` · `@utils` · `@config` · `@locales` · `@test-data`

### Platforms

`PLATFORM_TYPE` selects the Playwright projects in [playwright.config.ts](playwright.config.ts):

| `PLATFORM_TYPE` | Projects |
|---|---|
| `desktop` *(default)* | Chromium Desktop |
| `mobile` | iPhone 14 Pro (WebKit) + Samsung Galaxy S20 (Chromium) |
| `both` | Chromium Desktop + WebKit Desktop |

---

## Conventions you must follow

These are enforced by [CLAUDE.md](CLAUDE.md) and the skills. They apply to hand-written code too —
code review will hold you to them.

### The mandatory Page Object member order

Members appear in this exact order. It makes any Page Object in the repo scannable.

1. Sub-pages (`private header: HeaderSection`)
2. Web elements (`Locator` fields)
3. Variables
4. Constructor — instantiate `WebUtil`, assign locators
5. Getters & setters
6. **Fill** methods — `enterUsername`, `enterPassword`
7. **Click** methods — `clickOnLoginButton`
8. **Upload** methods — `uploadImage`
9. **Select** methods — `selectCountryDropdown`
10. **Validation** methods — `isLabelVisible`, `getSuccessMessageText`

One class per page. Sub-components (headers, modals, nav bars) live in `pages/sections/`.
Navigation methods that land on another page should **return the next Page Object**, so tests
chain naturally. [pages/LoginPage.ts](pages/LoginPage.ts) is the canonical reference.

### Locator priority

Pick the **highest-priority strategy that works**:

1. **`data-testid` / `data-test`** — `page.getByTestId('login-button')`. Immune to text, CSS and
   localization changes. *Ask the dev team to add these where they're missing — it is the single
   highest-leverage thing you can do for test stability.*
2. **CSS** — `button[type="submit"]`, `#username`. Fast and readable.
3. **Semantic XPath** — only when CSS can't express the relationship:
   `//label[@for="RequestNumber"]/following-sibling::span`.
4. **Localized-text XPath** — load the string first, then match:
   ```ts
   const { requestNumberLabel } = getLocale('request');
   page.locator(`//label[text()="${requestNumberLabel}"]`);
   ```

Role/label engines (`page.getByRole('button', { name: 'Log in' })`, `page.getByLabel('Username')`)
are stable and encouraged.

**Banned — never write these:**

- ❌ Absolute XPath: `/html/body/div[2]/main/div[3]/form/div[2]/span`
- ❌ Deep positional chains: `//div[2]/div[4]/span[3]`
- ❌ `nth-child()` unless the layout is provably stable

Validate locators in **both** languages for localized UIs. Encapsulate every locator in a Page
Object — never inline in a test.

### Naming

| Thing | Convention | Example |
|---|---|---|
| Classes | PascalCase | `LoginPage`, `CheckoutPage` |
| Test files | kebab-case | `login.spec.ts` |
| Variables / objects | camelCase | `userData`, `authEndpoints` |
| JSON test-data keys | snake_case | `login_valid_credentials` |
| Web elements | camelCase + **type suffix** | `usernameTextField`, `loginButton`, `countryDropdown`, `termsCheckbox`, `forgotPasswordLink`, `usernameLabel` |

**No abbreviations.** `loginButton`, not `logBTN`. `passwordTextField`, not `pwdTF`.

### Test titles & traceability

```
[<caseId>] validate that <action> <context>
```

e.g. `[SCRUM-123] validate that the user can login with valid credentials`. The id chains all the
way from the story → the plan's scenario headings → the spec title → the Allure report. Don't
break the chain.

### Tags

Always from [utils/tags/tags.ts](utils/tags/tags.ts) — never a hardcoded string. Available now:

- **Type:** `@smoke` `@regression` `@sanity`
- **Priority:** `@p0` `@p1` `@p2` `@critical` `@high` `@medium` `@low`
- **Cross-functional:** `@api` `@ui` `@accessibility` `@performance` `@security`
- **Lifecycle:** `@wip` `@flaky` `@featureNotReady`
- **Feature:** `@login` `@search` `@checkout` — *extend this section per project*

### Localization

Strings come from `locales/<lang>/<feature>.ts` via `getLocale('feature')`. `en` and `ar` files
must have **identical keys**; `en` is the fallback when a key or file is missing. Use
`export default {}`.

The example suite is parameterized by `LANGUAGE`: the spec navigates the app to `/language/<lang>`
*and* asserts against that language's locale file, so the same four tests run in both `en` and
`ar` with no duplication. Copy that pattern.

### Clean code

- One responsibility per method.
- **≤ 1 parameter** per method — except composite steps like `login(email, password)`.
- **No `console.log` in Page Objects** — `WebUtil` already logs every step.
- **Never weaken an assertion to make a test pass.** If it fails, either the app is wrong (file a
  bug) or the automation is wrong (fix the automation).

---

## Configuration & environments

`config/.env.<ENV>` files, loaded by [config/config.ts](config/config.ts). `ENV` defaults to
`testing`.

| Variable | Purpose | Example |
|---|---|---|
| `ENV` | Which `.env` file **and** which `test-data/<env>/` folder to load | `testing` (default), `staging` |
| `BASE_URL` | The app under test | `https://test.osool.cloud` |
| `BASE_API` | API base URL for the `api/` layer | |
| `API_KEY` | API auth | |
| `LANGUAGE` | Locale strings **and** app UI language | `en` (default), `ar` |
| `PLATFORM_TYPE` | Which Playwright projects run | `desktop` (default), `mobile`, `both` |
| `SLOWMO` | ms between actions in `test:live` | `800` (default) |
| `WORKERS` | Parallel workers in CI | |

`config.ts` exposes `loadConfig()`, `getLocale(feature)`, `getTestData` and a `config` object
whose fields are **getters** — they read `process.env` at access time, because the module is
imported before dotenv runs.

Adding an environment: create `config/.env.<name>` **and** `test-data/<name>/testData.ts`, then
run with `ENV=<name>`.

---

## MCP setup

[.mcp.json](.mcp.json) declares two servers; `.claude/settings.json` auto-enables them.

| Server | Transport | Used for |
|---|---|---|
| **playwright** | stdio, auto-starts via `npx @playwright/mcp` | The **planner** exploring the live app. Zero setup. |
| **atlassian** | remote SSE (OAuth) | Fetching Jira issues for `/qe-from-jira` |

**The Atlassian server needs a one-time interactive authorization on each machine:**

1. Open the project in Claude Code (VSCode).
2. Run `/mcp`, select **atlassian**, complete the browser sign-in.
3. `/qe-from-jira <KEY>` now works.

Until you do this, `/qe-from-jira` will tell you to authorize rather than fabricate the issue
content. Using a different Jira MCP (self-hosted or third-party)? Swap the `atlassian` entry in
`.mcp.json` — the `story-intake` skill discovers Jira tools dynamically, so nothing else changes.

> **MCP vs CLI — the split matters.** The Playwright **MCP** is for *interactive exploration
> during planning* (navigate, snapshot, inspect the DOM). The Playwright **CLI** is for *running
> and debugging* the generated specs. They are not interchangeable.

---

## Project structure

```
.claude/
  agents/          pw-test-planner, pw-test-generator, pw-test-healer
  commands/        /qe-from-story, /qe-from-jira, /qe-heal
  skills/          story-intake, pom-conventions, locator-strategy, playwright-cli
  settings.json    MCP auto-enable + tool permissions (git commit/push = ask)
.mcp.json          Playwright + Atlassian MCP servers
CLAUDE.md          The rules every agent obeys — read this

pages/             Page Objects (one class per page)
  action-healing/  web-util.ts — the mandatory action wrapper
  sections/        Reusable sub-components (headers, modals, nav)
api/
  model/           Builder-pattern request payloads
  service/         Raw HTTP calls
  request-flow/    Business workflows the tests call
tests/
  ui/              UI specs
  api/             API specs (not created yet — `npm run test:api` expects it here)
locales/
  en/              Fallback — must always exist
  ar/              Identical keys to en/
config/
  config.ts        dotenv loader + getLocale + getTestData
  .env.testing     Default environment
  .env.staging
utils/tags/        tags.ts — the central TAGS map
test-data/
  testing/         Per-environment data (testData.ts)
  fixtures/        Static HTML fixtures

stories/           Drop pasted user stories here (.md)
specs-plans/       Planner output — reviewed and approved before generation
Docs/              team-onboarding.html — a self-contained onboarding slide deck
```

**[Docs/team-onboarding.html](Docs/team-onboarding.html)** is a self-contained presentation
walking through intake → plan → approve → generate → run → heal. Open it in any browser (no
server needed). `←`/`→`/`Space` to navigate, number keys to jump, `F` for fullscreen.

---

## Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `Cannot find module '@pages/...'` | Alias missing from **one** of `tsconfig.json` (`paths`) or `package.json` (`_moduleAliases`). Add it to both. |
| `.env file not found at: ...` | `ENV` points at an environment with no `config/.env.<ENV>` file. |
| `Failed to load test data for environment X` | Missing `test-data/<X>/testData.ts`. |
| Test passes locally, fails in CI | CI runs `workers: 1` + `retries: 2` and `forbidOnly`. Check for a stray `test.only`, and for order-dependence between tests. |
| Locator resolves to multiple elements | Scope it. See the `button.signIn-createBtn` note in [pages/LoginPage.ts](pages/LoginPage.ts) — a plain `button[type="submit"]` also matches a *hidden* OTP button on that page. |
| Test hangs waiting for a spinner | `WebUtil.loaderSelector` doesn't match your app's loader. Fix it in [web-util.ts](pages/action-healing/web-util.ts). |
| `allure: command not found` / Allure fails | Java is not on the `PATH`. Tests still run; only the report generation needs it. |
| Flaky test | `npm run test:live -- <spec>` to watch it, then `npx playwright show-trace` on the failure. Fix the wait or the locator — **never** loosen the assertion. |

---

## Housekeeping for the team

Three things a new contributor should know are currently true of `main`:

1. **A real password is committed.** `SUPERADMIN_PASSWORD=Tarqeem21` sits in plaintext in
   [config/.env.testing](config/.env.testing), and `.gitignore` only excludes
   `config/.env.*.local` — not `config/.env.*`. Before this repo goes anywhere public: rotate that
   credential, move the env files out of version control (commit `.env.testing.example` instead),
   and inject secrets from the CI secret store.

2. **`test-data/fixtures/login.html` is unused.** It was the offline fixture for an earlier
   version of the login spec; the spec now targets the live Osool environment. It's harmless, but
   don't assume the suite runs offline — it doesn't.

3. **Don't commit or push without being asked.** Both the agents and `.claude/settings.json`
   enforce this; the same courtesy applies to humans on shared branches.

### Contributing checklist

Before you open a PR:

- [ ] `npm run typecheck` is clean
- [ ] Every action goes through `WebUtil` — no direct `page.click` / `page.fill`
- [ ] No banned locators (absolute XPath, deep positional chains, unstable `nth-child`)
- [ ] Page Object members are in the mandatory order
- [ ] Test titles are `[caseId] validate that ...`
- [ ] Tags come from `utils/tags/tags.ts`
- [ ] New strings exist in **both** `locales/en/` and `locales/ar/` with identical keys
- [ ] No secrets in `test-data/` — they belong in `config/.env.<env>`
- [ ] No assertion was weakened to make a test go green
