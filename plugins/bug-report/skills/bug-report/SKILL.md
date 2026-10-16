---
name: bug-report
description: "Use when the user asks to draft a bug report or turn rough bug notes into a report. Not for fixing bugs, debugging code, or explaining errors."
---

# Bug report

1. Before drafting or reading a template, check for reproduction steps, expected
   behavior, and actual behavior. If any are missing, ask one focused question
   and stop. Do not produce a partial report or use `Not provided.` for these
   required details.
2. Choose the template from the notes:
   - A page, window, or control behaves incorrectly: [UI report](templates/ui.md).
   - A terminal command fails or produces incorrect output: [CLI report](templates/cli.md).
   If the surface is unclear, ask which one the user is reporting.
3. Read only the chosen template. Paths are relative to this skill's directory.
4. Draft the report in chat using the template's headings. Replace placeholders
   with supplied facts; use `Not provided.` for missing optional details.
   Preserve control labels, commands, versions, error messages, and exit codes.
   Remove credentials or tokens from pasted commands and logs.

Do not inspect project files, modify code, diagnose a root cause, propose a fix,
or submit an issue unless separately requested.
