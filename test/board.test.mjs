import test from "node:test";
import assert from "node:assert/strict";
import { request } from "node:http";
import { createBoard } from "../plugins/team-brainstorm/com.github.copilot/extensions/brainstorm/board.mjs";
import { startServer } from "../plugins/team-brainstorm/com.github.copilot/extensions/brainstorm/server.mjs";

test("notes can be added, edited, moved, and deleted without leaking mutable state", () => {
  const board = createBoard();
  const events = [];
  const unsubscribe = board.subscribe((value) => events.push(value));
  const { id } = board.save({ text: " An idea ", column: "ideas" }).notes[0];
  board.read().notes[0].text = "tampered";
  assert.equal(board.read().notes[0].text, "An idea");
  board.save({ id, text: "A next step", column: "next" });
  assert.equal(board.read().notes[0].column, "next");
  board.remove(id);
  assert.deepEqual(board.read(), { notes: [] });
  assert.equal(events.length, 3);
  unsubscribe();
  board.save({ text: "Another", column: "questions" });
  assert.equal(events.length, 3);
  assert.deepEqual(createBoard().read(), { notes: [] });
});

test("invalid notes and stale IDs report errors without changing state", () => {
  const board = createBoard();
  for (const input of [null, [], {}, { text: " ", column: "ideas" },
    { text: "x".repeat(501), column: "ideas" }, { text: "x", column: "other" },
    { text: "x", column: "ideas", surprise: true },
    { id: "missing", text: "x", column: "ideas" }]) {
    assert.throws(() => board.save(input));
    assert.deepEqual(board.read(), { notes: [] });
  }
  assert.throws(() => board.remove("missing"));
  for (let i = 0; i < 100; i++) board.save({ text: String(i), column: "ideas" });
  assert.throws(() => board.save({ text: "too many", column: "ideas" }), /full/);
});

test("HTTP page and mutations work; invalid and cross-origin requests are rejected", async (t) => {
  const board = createBoard();
  const server = await startServer(board);
  t.after(() => server.close());
  const page = await fetch(server.url);
  assert.match(await page.text(), /Room to think/);
  assert.ok(page.headers.get("content-security-policy"));
  const post = (path, body, headers = {}) => fetch(new URL(path, server.url), {
    method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body),
  });
  const response = await post("/notes", { text: "<script>alert(1)</script>", column: "ideas" });
  assert.equal(response.status, 200);
  const { notes } = await response.json();
  assert.equal(notes[0].text, "<script>alert(1)</script>");
  assert.equal((await post("/notes", { text: "bad", column: "elsewhere" })).status, 400);
  assert.equal((await post("/notes", { text: "foreign", column: "ideas" }, { Origin: "https://example.com" })).status, 403);
  const foreignHostStatus = await new Promise((resolve, reject) => {
    const req = request(new URL("/board", server.url), { headers: { Host: "example.com" } }, (res) => {
      res.resume();
      resolve(res.statusCode);
    });
    req.on("error", reject);
    req.end();
  });
  assert.equal(foreignHostStatus, 403);
  assert.equal((await post("/remove", { id: notes[0].id })).status, 200);
  assert.deepEqual(board.read(), { notes: [] });
  assert.equal((await post("/notes", { text: "x", column: "ideas" }, { "Content-Type": "text/plain" })).status, 415);
  assert.equal((await fetch(new URL("/notes", server.url), { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" })).status, 400);
  assert.equal((await fetch(new URL("/missing", server.url))).status, 404);
});

test("event stream receives agent-side changes", async (t) => {
  const board = createBoard();
  const server = await startServer(board);
  t.after(() => server.close());
  const abort = new AbortController();
  const response = await fetch(new URL("/events", server.url), { signal: abort.signal });
  const reader = response.body.getReader();
  assert.match(new TextDecoder().decode((await reader.read()).value), /"notes":\[\]/);
  board.save({ text: "From the agent", column: "next" });
  assert.match(new TextDecoder().decode((await reader.read()).value), /From the agent/);
  abort.abort();
});
