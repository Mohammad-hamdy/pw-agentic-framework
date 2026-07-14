---
name: story-intake
description: >-
  Normalize a requirement — a pasted/inline user story, a Markdown file under
  stories/, or a Jira issue fetched via the Atlassian MCP — into a consistent
  acceptance-criteria checklist the planner can consume. Read this at the very
  start of any test-authoring flow.
---

# Story intake

Goal: produce one normalized story object regardless of source, so the planner
always works from the same shape.

## Sources
1. **Inline / pasted text** — the user gives the story in the prompt.
2. **File** — a `.md` under `stories/` (path passed as the argument).
3. **Jira** — an issue key (e.g. `SCRUM-123`). Fetch it with the Atlassian MCP:
   - Use the Atlassian MCP tools (search them via ToolSearch, e.g. "jira issue")
     to get the issue by key. Read: summary, description, acceptance criteria,
     labels/components, status, and linked attachments.
   - If the Atlassian MCP is not authorized, tell the user to run `/mcp` and
     authorize the `atlassian` server, then retry. Do not fabricate story content.

## Normalized output
Produce this structure (in your working context, and echo it to the user):

```
Story:
  id: <US-id or Jira key or "inline">
  title: <one line>
  summary: <2–3 sentences>
  actors: [ ... ]
  preconditions: [ ... ]
  acceptanceCriteria:
    - AC1: <testable statement>
    - AC2: ...
  outOfScope: [ ... ]
  openQuestions: [ ... ]   # ambiguities to confirm with QA before planning
```

## Rules
- Every acceptance criterion must be **atomic and testable**. Split compound ones.
- If the story lacks acceptance criteria, derive candidate ACs from the
  description and mark them as `openQuestions` for confirmation — do not treat
  guesses as agreed requirements.
- Preserve the source id so traceability tags (`[SCRUM-123]`) can be applied later.
- Hand the normalized story to `pw-test-planner`; intake never explores the app or
  writes tests.
