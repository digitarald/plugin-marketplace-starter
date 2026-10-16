# Bug report

One portable skill and two Markdown templates. No hooks, scripts, or SDK extension.
Ask Copilot to turn rough notes into a bug report. It chooses a UI or CLI template,
asks for essential missing details, and drafts the report in chat.

## What this teaches

- **Discovery:** the description names the reporting task and excludes debugging.
- **Progressive disclosure:** the skill reads only the template it needs.
- **Workflow:** missing reproduction steps or behavior details trigger a question.
- **Boundaries:** the skill drafts a report; it does not fix code or file an issue.

Customize the [templates](skills/bug-report/templates/) for your team's reports.
Keep the routing rules in [SKILL.md](skills/bug-report/SKILL.md) short.

## Try it

> Turn these notes into a bug report. Open Settings, switch Theme to Dark,
> then reload. Expected: Dark stays selected. Actual: Theme resets to Light.

## Smoke checks

Try each prompt in a fresh session. Inspect the tool trace as well as the answer:
the skill should load before drafting, and only the chosen template should be read.

| Prompt | Expected behavior |
|---|---|
| The Theme example above | Reads `templates/ui.md`; writes numbered steps; marks the environment `Not provided.` |
| "Draft a bug report: run `acme sync --dry-run` in an empty folder. Expected: no files change. Actual: creates `cache.db` and prints `created cache.db`. Exit code 0." | Reads `templates/cli.md`; preserves the command, output, and exit code |
| "Draft a bug report. Expected: Submit saves the form. Actual: nothing happens. I haven't recorded how to reproduce it." | Requests reproduction steps; reads no template and drafts no report yet |
| "Explain why `add(a, b) { return a - b; }` gives the wrong sum." | Does not load the skill or draft a report |

For machine-readable evidence, Copilot CLI supports `--output-format json`.
Check `tool.execution_start` and `tool.execution_complete` events for skill
loading and template reads, then inspect the final `assistant.message`.
These model-backed checks are optional and separate from `npm run verify`.
In non-interactive CLI mode, missing details may be reported as a blocker rather
than a question. The important check is that drafting stops until they are known.
