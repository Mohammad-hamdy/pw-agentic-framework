# CLAUDE.md — Playwright Agentic QE Framework

Rules every agent and every generated file in this repo must follow.

## What this framework is
An agentic Playwright + TypeScript automation framework. Requirements come in as
**user stories** or **Jira issues**; Claude agents explore the app, plan tests,
generate POM-based specs, and self-heal failures. Human approval gates sit between
planning and generation, and before any healing fix is applied.

## The workflow (never skip the gates)
1. **Intake** (`story-intake` skill) — normalize the US/Jira issue into atomic,
   testable acceptance criteria.
2. **Plan** (`pw-test-planner` agent) — explore the live app with the Playwright
   MCP, write an evidence-based plan to `specs-plans/`. **Stop for QA approval.**
3. **Generate** (`pw-test-generator` agent) — only from an approved plan. Produce
   Page Objects + specs + locales + test data, then run them via the Playwright CLI.
4. **Heal** (`pw-test-healer` agent) — diagnose failures; fix automation issues,
   report app bugs. **Stop for approval before applying a fix.**

Slash commands orchestrate this: `/qe-from-story`, `/qe-from-jira`, `/qe-heal`.

## Non-negotiable coding rules (see `pom-conventions` + `locator-strategy` skills)
- **POM only.** One class per page under `pages/`; sections under `pages/sections/`.
  Follow the mandatory member order (elements → constructor → fills → clicks →
  uploads → selects → validations).
- **WebUtil for every action.** Never call `page.click`/`page.fill` directly.
- **Locator priority:** `data-testid` → CSS → semantic XPath → localized XPath.
  Banned: absolute XPath, deep `nth-child`.
- **Localization:** strings via `getLocale('feature')`; keep matching `en`/`ar`
  keys; `en` is the fallback.
- **Tags:** from `utils/tags/tags.ts`; never hardcode `'@smoke'`.
- **Test titles:** `[<caseId>] validate that ...` for traceability.
- **Clean code:** one job per method, ≤1 param except composite steps, no
  `console.log` in Page Objects, no duplication.
- **Never weaken assertions** to make a test pass.

## Path aliases
`@pages`, `@api`, `@utils`, `@config`, `@locales`, `@test-data` (see `tsconfig.json`
and `_moduleAliases` in `package.json`). Import via aliases, not deep relative paths.

## Environments
`config/.env.<ENV>` (default `testing`). Select with `ENV`, platform with
`PLATFORM_TYPE` (`desktop` | `mobile` | `both`), language with `LANGUAGE`.

## MCP servers (`.mcp.json`)
- `playwright` — app exploration during planning (stdio, auto-starts).
- `atlassian` — Jira issue fetch (remote SSE, OAuth). Authorize via `/mcp` once
  per machine before `/qe-from-jira`.

## Don't commit unless asked. Don't push without explicit approval.
