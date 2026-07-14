---
description: Generate Playwright tests from a Jira issue fetched via the Atlassian MCP
argument-hint: <JIRA-ISSUE-KEY, e.g. SCRUM-123>
---

Author automation for the Jira issue: **$ARGUMENTS**

1. **Fetch & intake** — Apply the `story-intake` skill. Fetch issue `$ARGUMENTS`
   using the Atlassian MCP (find the Jira tools via ToolSearch, e.g. "jira get
   issue"). Read the summary, description, acceptance criteria, labels/components
   and attachments, then normalize it into the acceptance-criteria checklist.
   - If the `atlassian` MCP server is not authorized, tell me to run `/mcp` and
     authorize it, then retry. Do not fabricate the issue content.
   - Preserve the issue key so tests are tagged `[$ARGUMENTS] validate that ...`.

2. **Plan** — Launch `pw-test-planner` with the normalized story. It explores the
   app via the Playwright MCP and writes an evidence-based plan to `specs-plans/`.
   Show me the plan and **stop for my approval.**

3. **Generate** — After approval, launch `pw-test-generator` on the approved plan
   to produce Page Objects + specs (per `pom-conventions` / `locator-strategy`),
   then run them with the Playwright CLI.

4. **Heal (if needed)** — Use `pw-test-healer` for locator/timing failures.

Summarize created files and the run outcome. Do not commit unless I ask.
