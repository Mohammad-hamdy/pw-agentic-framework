---
description: Generate Playwright tests from a user story (file path or inline text)
argument-hint: <path-to-story.md | inline story text>
---

Author automation for the user story: **$ARGUMENTS**

Run the full agentic flow with human approval gates:

1. **Intake** — Apply the `story-intake` skill to normalize the story into an
   acceptance-criteria checklist. If `$ARGUMENTS` is a path, read that file
   (e.g. under `stories/`); otherwise treat it as the inline story text. Echo the
   normalized story and confirm the acceptance criteria with me.

2. **Plan** — Launch the `pw-test-planner` agent with the normalized story. It
   explores the app via the Playwright MCP and writes an evidence-based plan to
   `specs-plans/`. Show me the plan and **stop for my approval.** Do not generate
   code yet.

3. **Generate** — Only after I approve, launch the `pw-test-generator` agent on
   the approved plan. It creates/updates Page Objects, specs, locales, tags and
   test data following the `pom-conventions` and `locator-strategy` skills, then
   runs the new specs with the Playwright CLI and reports results.

4. **Heal (if needed)** — If specs fail on a locator/timing issue, hand off to the
   `pw-test-healer` agent. Report app bugs; never weaken assertions to force a pass.

Summarize what was created and the test run outcome at the end. Do not commit
unless I ask.
