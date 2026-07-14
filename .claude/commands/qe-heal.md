---
description: Diagnose and fix a failing Playwright spec (automation issue) or report an app bug
argument-hint: <spec path | trace.zip path | test title>
---

Diagnose the failing test: **$ARGUMENTS**

Launch the `pw-test-healer` agent. It should:

1. Reproduce the failure (re-run with `--trace on` if no trace exists) and read
   the exact assertion/locator that failed, using the `playwright-cli` skill to
   open the trace and screenshots.
2. Classify the root cause as an **application issue** (real product defect — do
   not edit the test; report it) or an **automation issue** (brittle locator,
   missing wait, wrong data, race).
3. For automation issues, propose the **minimal** fix per the `locator-strategy`
   and `pom-conventions` skills. Never weaken/delete assertions or add banned
   locators. Show me the diagnosis and proposed change and **wait for approval.**
4. After approval, apply the fix and re-run (2–3 times if it looked flaky) to
   confirm it is green and stable.

Report the diagnosis, the fix (or the app-bug write-up), and the re-run result.
