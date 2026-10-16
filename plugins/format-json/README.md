# Format JSON

A shared-runtime `postToolUse` hook that formats JSON files after successful
agent edits. There is no skill to invoke.

## How it works

The hook reads `toolName`, `toolArgs`, `toolResult.resultType`, and `cwd` from
the CLI-compatible event. Only a `success` result can trigger formatting.
It supports these tool inputs:

| Tool | Affected paths |
|---|---|
| `create`, `edit` | `path` |
| `create_file`, `replace_string_in_file` | `filePath` |
| `multi_replace_string_in_file` | Each `replacements[].filePath` |
| `apply_patch` | Add/update headers and move destinations, excluding deletions |

`toolArgs` may be an object or JSON-encoded string. `apply_patch` also accepts
the raw patch string and the runtime's `input` or `patch` object forms.
Paths resolve against the event's `cwd`, not the hook process directory.

For each affected `.json` file, the hook uses Node's `JSON.parse` and
`JSON.stringify` to produce two-space indentation and a final newline.
It leaves already formatted files untouched. Invalid JSON stays unchanged,
with a parse diagnostic on stderr and in the assistant's tool context.
Other file errors are reported the same way, without stopping the remaining
files. Changed paths are returned as `additionalContext` so the assistant
knows to re-read the file.

No directory scans, shell commands, formatter downloads, or commit checks.
No permission decisions or tool-result replacements. Unrelated tools and
failed edits return `{}`.

## Requirements and limits

- Node.js 22.12+; no plugin runtime dependencies.
- Copilot CLI or VS Code using the shared runtime's CLI-compatible hooks.
- Only regular JSON files below the session working directory are eligible.
  Symbolic links and paths outside that directory produce a diagnostic.
- JSONC, comments, and trailing commas are not supported. Node's JSON number
  precision rules apply, so do not use this example for precision-sensitive
  numeric data.
- Shell-based writes and unrecognized edit tools are not detected. The hook
  does not roll back edits, enforce policy, or replace CI.

To use Prettier, Ruff, or another formatter, replace this script with your
team's formatter invocation and declare its prerequisites. Keep the affected-file
selection and report any content changed after the tool ran.
