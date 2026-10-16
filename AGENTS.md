# Maintaining this marketplace

Follow [README.md](README.md) for team setup, package layout, installation,
versioning, validation, and host checks. Update those instructions in place;
do not duplicate them here.

## Agent-specific rules

- Keep the starter to two example plugins and at most two skills. Do not add a
  UI framework, database, or build step. Never vendor the runtime SDK.
- Do not adopt legacy `.plugin/` or `.claude-plugin/` layouts from documentation.
- Skill descriptions explain when to invoke them. Put detailed instructions
  in the body, and do not duplicate a skill as a command.
- Formatter hooks must not return permission decisions. Return `{}` for no-ops,
  and never describe the hook as a security boundary or replacement for CI.
- Preserve coverage when replacing an example; do not delete tests just to
  make validation pass.
- Keep secrets and token-bearing URLs out of files. Use host authentication
  for private repositories, not embedded credentials.
- Do not commit, push, or publish unless the user requests it.

## Authoring references

Consult the relevant contract before changing package or catalog fields:

- [Agent Plugins 1.0 specification](https://agent-plugins.org/specification).
- [Canonical manifest schema](https://agent-plugins.org/schemas/1.0.0/plugin.schema.json),
  vendored in [scripts/plugin.schema.json](scripts/plugin.schema.json).
- [Creating Copilot plugins](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-creating).
- [Creating a team marketplace](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/plugins-marketplace).
- [CLI plugin and catalog reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference).

The README's [references](README.md#references) cover skills, hooks, and VS Code.
