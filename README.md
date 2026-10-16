# Plugin marketplace starter

A small GitHub template for teams distributing Agent Plugins 1.0 packages.
Two example plugins, one skill, no runtime dependency installation.

| Plugin | Try it | Teaches |
|---|---|---|
| [team-brainstorm](plugins/team-brainstorm/) | "Let's brainstorm a release plan together" | Skills, canvas actions, a shared session-only UI |
| [format-json](plugins/format-json/) | Ask Copilot to edit a JSON file | CLI-compatible post-tool hooks, affected-file formatting |

## Make it yours

1. Click **Use this template** on GitHub to create your team's repository.
2. Edit the marketplace `name` and `owner` in [marketplace.json](marketplace.json).
   Replace the repository reference in the install commands below with your own
   `OWNER/REPO`. Keep the marketplace name unique. Update the same marketplace
   name and plugin keys in [.github/copilot/settings.json](.github/copilot/settings.json).
3. Keep, rename, or delete the examples. Update each plugin's manifest, catalog
   entry, any skill metadata, README, changelog, and repository settings together.
4. If you rename the canvas, update both its ID in the extension and the
   companion skill's reference to it.
5. Run `npm ci` and `npm run verify`, then push your changes.
6. Test installation from your new GitHub repository before sharing it.

For agent-assisted setup and maintenance, see [AGENTS.md](AGENTS.md). It links
the plugin and marketplace specifications and adds agent-specific rules.

Only marketplace contributors need `npm ci`. Installed examples use Node.js
22.12 or newer and the SDK supplied by Copilot. Review plugins before trusting
them. The formatter rewrites JSON files after agent edits.

## Install the examples

Use a current Copilot CLI or a VS Code Copilot host using the shared runtime.
The canvas additionally needs a host that presents SDK canvases. Do not assume
every VS Code chat provider or CLI version supports that UI.

### Copilot CLI

```sh
copilot plugin marketplace add digitarald/plugin-marketplace-starter
copilot plugin install team-brainstorm@plugin-marketplace-starter
copilot plugin install format-json@plugin-marketplace-starter
```

Start a new session in a project you trust. The formatting hook runs automatically
after successful supported edit tools; it does not add a skill or command.

### VS Code

Run **Chat: Install Plugin from Source**, enter
`digitarald/plugin-marketplace-starter`, and select an example. Use a Copilot
session backed by the shared runtime. Start a new session if the host requests
it after installation.

If the canvas is unavailable, the brainstorm skill explains the limitation and
continues in chat. The CLI-compatible hook has no separate VS Code variant.

## Develop without publishing

Opening this checkout in a trusted shared-runtime Copilot session makes both
plugins available from the working files. The repository-scoped
[settings overlay](.github/copilot/settings.json) declares this directory as a
marketplace and enables each example. No global plugin installation is needed.
Start a new session after adding the overlay or changing plugin registrations.
Host trust prompts and managed policy still apply.

```sh
npm ci
npm run verify
copilot
```

Accept the folder-trust prompt for this checkout. After exiting the session,
check discovery from the same repository directory:

```sh
copilot plugin list --json
copilot plugin marketplace list --json
```

In a runtime with live repository marketplaces, the list shows both examples
as enabled with `source: "live"`. Changes are read from this checkout on session
startup rather than a globally installed copy.

If the plugins and marketplace are missing from the lists, first check folder
trust. The CLI omits an untrusted checkout's repository settings from these
listings. Trust the folder through an interactive session, then retry. Do not
install the plugins globally just to make local discovery work.

Listing verifies discovery only. It does not prove that the formatting hook
executes or that the host can present the canvas. Use the host checks below to
verify those behaviors.

For hosts without repository-overlay support, or to test in a different project,
pass both plugins explicitly with absolute paths:

```sh
copilot --plugin-dir /absolute/path/to/plugins/team-brainstorm \
  --plugin-dir /absolute/path/to/plugins/format-json
```

No plugin code depends on this repository's development dependencies.

## How the marketplace fits together

```text
marketplace.json
plugins/
  team-brainstorm/
    plugin.json
    skills/team-brainstorm/SKILL.md
    com.github.copilot/extensions/brainstorm/
      extension.mjs
      board.mjs
      server.mjs
      index.html
  format-json/
    plugin.json
    com.github.copilot/hooks/
      hooks.json
      format.mjs
scripts/                   # Catalog, schema, metadata, and syntax validation
test/                      # No-model behavior and extension contract tests
.github/copilot/           # Enables this checkout's marketplace in Copilot
.github/workflows/         # Validation on Linux, Windows, and macOS
```

Each plugin also has a README and changelog. Agent Plugins 1.0 discovers portable
skills from `skills/`. Copilot-specific hooks and SDK extensions belong in
`com.github.copilot/`. A portable MCP example would add `mcp.json` at the plugin
root; it is deliberately not included in this starter.

## Add a plugin

1. Copy the smaller example into `plugins/<name>/`.
2. Give it a unique name and update its manifest and any skill metadata.
3. Add a relative source entry to the catalog and enable it in the repository settings.
4. Keep the plugin self-contained. Never import a sibling plugin or root
   development dependency at runtime.
5. Add focused tests and a short README explaining prerequisites and risks.
6. Change its version in the manifest, catalog, and changelog for every release.

The root catalog is the source of installable examples. Deleting an example
also means removing its catalog entry, repository enablement, and associated tests.

## Validation and compatibility

`npm run verify` validates manifests against a vendored copy of the official
Agent Plugins 1.0 JSON Schema, catalog/version consistency, skill metadata,
Markdown links, repository marketplace settings, hook layout, and JavaScript syntax. Tests exercise board
behavior, the loopback HTTP server, extension lifecycle through an SDK contract
harness, page focus behavior through a minimal DOM harness, and the actual
formatter hook process with runtime-shaped edit events.
CI runs these checks on Node.js 22 and 24 on all three desktop operating systems.
CI does not invoke a model or require a GitHub token.

Before a release, smoke-test **both hosts**:

- Open this trusted checkout and confirm both plugins are enabled without
  global installation. Confirm the brainstorm skill is discovered.
- Install from GitHub in a separate test environment and confirm the same plugins.
- Open the canvas; add, edit, move, and delete notes from the UI and agent.
- Reopen the same panel and confirm notes remain. A new session starts empty.
- Keep keyboard focus on a note control while Copilot edits or moves that note.
  Confirm focus remains there, or returns to the input if the note is deleted.
- Edit JSON using single-file edits, multi-file edits, and `apply_patch`.
  Confirm two-space formatting, a final newline, and changed-file reporting.
- Check that failed edits and unrelated files are untouched. Invalid JSON must
  stay unchanged with a visible diagnostic. Already formatted JSON is not rewritten.

Automated contract tests do not substitute for these host checks. Canvas
presentation and full end-to-end VS Code/CLI behavior must be verified in the
versions your team deploys.

## References

- [Agent Plugins standard](https://agent-plugins.org/)
- [GitHub Copilot plugins](https://docs.github.com/en/copilot/concepts/agents/about-plugins)
- [Shared runtime hooks reference](https://docs.github.com/en/copilot/reference/hooks-reference)
- [VS Code agent plugins](https://code.visualstudio.com/docs/agent-customization/agent-plugins)
- [Agent Skills specification](https://agentskills.io/specification)
