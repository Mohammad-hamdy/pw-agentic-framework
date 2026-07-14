# Playwright Agentic QE Framework

An **agentic** Playwright + TypeScript automation framework. You describe a
requirement — a **user story** or a **Jira issue** — and Claude Code agents
explore the app (Playwright MCP), plan the tests, generate Page-Object-based
specs (Playwright CLI), run them, and self-heal failures — with human approval
gates in between.

It mirrors the design patterns of our production `Vehicles` framework: Page Object
Model, a `WebUtil` action-healing wrapper, path aliases, en/ar localization,
central tags, and a builder → service → request-flow API layer.

---

## Quick start

```bash
npm install
npx playwright install            # download browsers
npm test                          # runs the bundled worked example (green offline)
```

The worked example (`tests/ui/login.spec.ts`) runs against a local HTML fixture
(`test-data/fixtures/login.html`), so a fresh clone is green with no app or
network. Point `config/.env.testing` `BASE_URL` at your real app to author real
tests.

Useful scripts: `npm run test:smoke`, `npm run test:ui`, `npm run report`,
`npm run codegen`, `npm run typecheck`.

**Allure reporting** is wired in: any test run writes to `allure-results/`; then
`npm run allure:serve` (generate + open) or `npm run allure:generate` +
`npm run allure:open`. Needs Java on the PATH. See the `playwright-cli` skill.

---

## The agentic workflow

Open this folder in a **new VSCode window** with Claude Code. Then:

| Command | What it does |
|---------|--------------|
| `/qe-from-story <path-or-text>` | Author tests from a user story (e.g. `stories/example-login.md`). |
| `/qe-from-jira <ISSUE-KEY>` | Fetch a Jira story via the Atlassian MCP, then author tests. |
| `/qe-heal <spec-or-trace>` | Diagnose a failing test and fix it (or report an app bug). |

Each flow runs: **intake → plan → (your approval) → generate → run → heal**.

### Agents (`.claude/agents/`)
- **pw-test-planner** — explores the app via Playwright MCP, writes an
  evidence-based plan to `specs-plans/`. Stops for QA approval; writes no code.
- **pw-test-generator** — turns an approved plan into POM classes + specs, runs them.
- **pw-test-healer** — root-causes failures (app bug vs automation), proposes the
  minimal fix, requires approval before applying.

### Skills (`.claude/skills/`)
`story-intake` (normalize US/Jira), `pom-conventions` (POM + WebUtil + naming),
`locator-strategy` (locator priority + banned patterns), `playwright-cli`
(run/codegen/trace).

---

## MCP setup

`.mcp.json` declares two servers:

- **playwright** — starts automatically via `npx @playwright/mcp` (stdio); used by
  the planner to explore the app.
- **atlassian** — Jira, a remote OAuth server. It requires a **one-time
  authorization** you must do interactively:
  1. Open this project in Claude Code (VSCode).
  2. Run `/mcp`, select **atlassian**, and complete the browser sign-in.
  3. Then `/qe-from-jira <KEY>` will work.

> This scaffold was created in a non-interactive session, so the Atlassian OAuth
> is not yet completed — do the `/mcp` step above before using `/qe-from-jira`.

Prefer a different Jira MCP (e.g. a self-hosted or third-party server)? Replace the
`atlassian` entry in `.mcp.json` with your server's command/URL; the `story-intake`
skill discovers Jira tools dynamically, so no other change is needed.

---

## Project structure

```
.claude/           Agents, skills, slash commands, settings
.mcp.json          Playwright + Atlassian MCP servers
pages/             Page Objects (+ action-healing/web-util.ts, sections/)
api/               model/ (builders) → service/ (HTTP) → request-flow/ (workflows)
tests/             Specs: ui/ and api/
locales/           en/ + ar/ (en is the fallback)
config/            config.ts loader + .env.<env>
utils/tags/        Central TAGS map
test-data/         Per-env data + fixtures/
stories/           Drop pasted user stories here (.md)
specs-plans/       Planner output, approved before generation
CLAUDE.md          Rules the agents always follow
```

## Conventions

See `CLAUDE.md` and the `pom-conventions` / `locator-strategy` skills. Highlights:
POM only, all actions via `WebUtil`, `data-testid`-first locators, no absolute
XPath, `[caseId] validate that ...` test titles, tags from `utils/tags/tags.ts`,
localized strings via `getLocale()`.
