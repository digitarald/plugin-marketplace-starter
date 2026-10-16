---
name: team-brainstorm
description: "Brainstorm with the user on a shared board. Use when exploring ideas, comparing options, planning together, or collecting questions and next steps."
---

# Team brainstorm

1. Discover the `marketplace-starter-brainstorm` canvas capabilities.
2. Open it with a stable instance handle. It takes no input.
3. Read the board before changing it. Keep the user's existing notes.
4. Add a few short ideas or questions using `save_note`. Put each note in
   `ideas`, `questions`, or `next`. Do not fill the board with a complete plan
   before the user has contributed.
5. Ask one focused question, discuss the answer, and update the board.
   Use `save_note` with an existing ID to edit or move a note.
6. Summarize agreed next steps in chat. Do not implement them without the
   user's go-ahead.

The board has no persistence or export. Reopening during this session preserves
it; ending or reloading the extension loses it. Tell the user before relying on
it for durable decisions. If canvas tools are unavailable, explain that this
host cannot present the board and brainstorm in chat instead.
