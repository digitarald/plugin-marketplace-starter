import { createCanvas, CanvasError, joinSession } from "@github/copilot-sdk/extension";
import { createBoard, BoardError, noteSchema } from "./board.mjs";
import { startServer } from "./server.mjs";

const boards = new Map();
const panels = new Map();
let session;

function boardFor(ctx) {
  if (!ctx.sessionId) throw new CanvasError("missing_session", "A session ID is required.");
  if (!boards.has(ctx.sessionId)) boards.set(ctx.sessionId, createBoard());
  return boards.get(ctx.sessionId);
}

function action(handler) {
  return async (ctx) => {
    try {
      return handler(boardFor(ctx), ctx.input);
    } catch (error) {
      if (error instanceof BoardError) throw new CanvasError("invalid_note", error.message);
      throw error;
    }
  };
}

session = await joinSession({
  canvases: [createCanvas({
    id: "marketplace-starter-brainstorm",
    displayName: "Team brainstorm",
    description: "Collect ideas, questions, and next steps on a shared session-only board.",
    actions: [
      { name: "get_board", description: "Read every note on this session's board.", handler: action((board) => board.read()) },
      { name: "save_note", description: "Add a note, or edit and move an existing note by ID.", inputSchema: noteSchema, handler: action((board, input) => board.save(input)) },
      {
        name: "remove_note",
        description: "Remove one note by ID.",
        inputSchema: { type: "object", additionalProperties: false, properties: { id: { type: "string", minLength: 1 } }, required: ["id"] },
        handler: action((board, input) => board.remove(input.id)),
      },
    ],
    async open(ctx) {
      const key = JSON.stringify([ctx.sessionId, ctx.instanceId]);
      if (!panels.has(key)) {
        panels.set(key, startServer(boardFor(ctx), (error) => session.log(String(error))));
      }
      try {
        return { title: "Team brainstorm", url: (await panels.get(key)).url };
      } catch (error) {
        panels.delete(key);
        throw new CanvasError("server_failed", `Could not open board: ${error.message}`);
      }
    },
    async onClose(ctx) {
      const key = JSON.stringify([ctx.sessionId, ctx.instanceId]);
      const panel = panels.get(key);
      panels.delete(key);
      if (panel) await (await panel).close();
    },
  })],
});
await session.log("Team brainstorm ready. Notes are session-only.");
