import { randomUUID } from "node:crypto";

export const columns = ["ideas", "questions", "next"];
export const noteSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    id: { type: "string", minLength: 1 },
    text: { type: "string", minLength: 1, maxLength: 500 },
    column: { type: "string", enum: columns },
  },
  required: ["text", "column"],
};

export class BoardError extends Error {}

export function createBoard() {
  const notes = new Map();
  const listeners = new Set();
  const read = () => ({ notes: [...notes.values()].map((note) => ({ ...note })) });
  function publish() {
    for (const listener of listeners) listener(read());
    return read();
  }
  return {
    read,
    save(input) {
      if (!input || typeof input !== "object" || Array.isArray(input)
        || Object.keys(input).some((key) => !["id", "text", "column"].includes(key))
        || typeof input.text !== "string" || !input.text.trim()
        || input.text.length > 500 || !columns.includes(input.column)) {
        throw new BoardError("Use text of 1-500 characters and an ideas, questions, or next column.");
      }
      if (input.id !== undefined && (typeof input.id !== "string" || !notes.has(input.id))) {
        throw new BoardError("That note no longer exists. Read the board and try again.");
      }
      if (input.id === undefined && notes.size >= 100) {
        throw new BoardError("The board is full. Remove a note before adding another.");
      }
      const note = { id: input.id ?? randomUUID(), text: input.text.trim(), column: input.column };
      notes.set(note.id, note);
      return publish();
    },
    remove(id) {
      if (typeof id !== "string" || !notes.delete(id)) {
        throw new BoardError("That note no longer exists. Read the board and try again.");
      }
      return publish();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
