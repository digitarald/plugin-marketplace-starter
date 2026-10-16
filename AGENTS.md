# Maintaining this marketplace

This repository is a template for a team's Copilot plugin marketplace.
Read [README.md](README.md) for setup, installation, and host checks.

## Adapt the template for a team

1. Use the team's chosen marketplace name and owner in
   [marketplace.json](marketplace.json). Update the repository references in
   the README's installation commands.
2. Keep the marketplace name and `plugin@marketplace` keys in
   [.github/copilot/settings.json](.github/copilot/settings.json) synchronized
   with the catalog. The directory source must continue to point at `.` so
   contributors can use the working checkout without a global installation.
3. Replace, rename, or remove the examples to fit the team's workflows.
   Keep each plugin's manifest, catalog entry, README, changelog, and any skill
   metadata consistent. Remove associated tests and repository enablement when
   removing a plugin. Preserve focused coverage for replacement behavior.
4. Document each plugin's supported hosts, prerequisites, and effects on files
   or commands. Keep secrets and token-bearing URLs out of published files.
   Private repositories require access through the host's authentication, not
   credentials embedded in manifests or installation instructions.
5. Run `npm run verify`, then follow the README's CLI and VS Code smoke checks.
   Check GitHub installation after publication separately from local discovery.
   Do not commit, push, or publish unless the user requests it.

## Package conventions

Use Agent Plugins 1.0, not legacy `.plugin/` or `.claude-plugin/` layouts.
Each plugin is self-contained under `plugins/<name>/`, with a root
`plugin.json` declaring the canonical schema. Portable skills live in
`skills/<name>/SKILL.md`. Copilot hooks and SDK extensions live under
`com.github.copilot/hooks/` and `com.github.copilot/extensions/`.

Keep the starter small: two example plugins, at most two skills, no UI
framework, database, build step, or runtime dependency installation.
The Copilot runtime supplies `@github/copilot-sdk/extension`.

The repository overlay in `.github/copilot/settings.json` points at the root
marketplace. Keep its marketplace name and enabled plugin keys in sync with
`marketplace.json` when adding, removing, or renaming plugins.

When changing a plugin, bump its semantic version in both `plugin.json` and
`marketplace.json`, and add the same version to its changelog. Update the
plugin README for behavior or compatibility changes.

## Validation and host behavior

Run `npm run verify` before proposing changes. Add focused tests for behavior
changes. Use CLI-compatible hooks for the shared Copilot runtime. Format only
files named by successful edit tools, and report changed files and diagnostics.
Never return permission decisions from the formatter. No-op hooks return `{}`.
Never describe the example hook as a security boundary or replacement for CI.

Skill descriptions must explain when to invoke the skill. Keep detailed
instructions in the body rather than the description. Do not duplicate a
skill as a command.

Repository settings are loaded only for trusted folders. Start an interactive
`copilot` session from this checkout and accept folder trust before checking
`copilot plugin list --json`. Expect enabled local entries with `source: "live"`.
Discovery does not verify hook execution or canvas presentation. Contract tests
and browser tests do not replace real shared-runtime host checks.

## Official docs and specifications

Consult these sources before changing package layouts, catalog fields, or
runtime contracts:

- [Agent Plugins 1.0 specification](https://agent-plugins.org/specification)
  defines the portable package, component discovery, and client extensions.
- [Plugin manifest JSON Schema](https://agent-plugins.org/schemas/1.0.0/plugin.schema.json)
  is the canonical schema declared by each root `plugin.json`.
  [scripts/plugin.schema.json](scripts/plugin.schema.json) is the vendored copy
  used by [scripts/validate.mjs](scripts/validate.mjs).
- [Agent Skills specification](https://agentskills.io/specification) defines
  `SKILL.md` structure and metadata.
- [Creating Copilot plugins](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-creating)
  explains plugin authoring and Copilot-specific components.
- [Creating a Copilot marketplace](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-marketplace)
  explains catalog metadata, relative sources, and sharing with a team.
- [Copilot CLI plugin reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference)
  covers catalog fields and install, update, and marketplace commands.
- [Shared-runtime hooks reference](https://docs.github.com/en/copilot/reference/hooks-reference)
  defines hook configuration, event payloads, and output contracts.
- [VS Code agent plugins](https://code.visualstudio.com/docs/agent-customization/agent-plugins)
  covers installation and host-specific behavior.

Some Copilot docs also show legacy package and catalog locations. Keep this
starter's root `marketplace.json` and Agent Plugins 1.0 layout; do not copy a
legacy layout into it. Marketplace distribution and Copilot hooks/extensions
are client-specific, not portable components defined by Agent Plugins 1.0.
