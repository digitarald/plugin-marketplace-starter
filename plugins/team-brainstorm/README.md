# Team brainstorm

A shared, session-only brainstorm board for a person and Copilot.

| Skill | Use when |
|---|---|
| `team-brainstorm` | Exploring ideas, comparing options, or collecting questions and next steps |

## How it works

The skill opens `marketplace-starter-brainstorm`. The human edits notes in the
page; the agent uses `get_board`, `save_note`, and `remove_note`. Server-sent
events keep human and agent changes visible without polling.

There are three columns: Ideas, Questions, Next. Edit a note to change its column.
Incoming updates preserve keyboard focus on the same note control, including
when a note moves columns. If that note is deleted, focus returns to the input.
Each session owns one in-memory board, shared by its panels. Reopening a panel
preserves notes. Ending or reloading the extension discards them. No export,
disk storage, external services, or credentials.

Node.js 22.12+ and a Copilot host with SDK canvas presentation are required.
The runtime resolves `@github/copilot-sdk/extension`; do not install it into the
plugin. Hosts without canvas presentation can still use the skill in chat.
The loopback server binds only to `127.0.0.1`, rejects foreign Host/Origin
headers, and closes when the runtime closes its instance.

## Structure

```text
plugin.json
skills/team-brainstorm/SKILL.md
com.github.copilot/extensions/brainstorm/
  extension.mjs     # SDK registration, actions, lifecycle
  board.mjs         # Session-local note model and validation
  server.mjs        # Loopback HTTP and event stream
  index.html        # Plain HTML, CSS, and browser JavaScript
```

## Customize

Change the skill's workflow to match your team's planning habits. Change column
names in the board model, page, and skill together. Choose a distinctive canvas
ID when copying the plugin so independently installed examples do not collide.
Keep server and action input validation in the shared model.
