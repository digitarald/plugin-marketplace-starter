import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

test("SDK contract: actions, session isolation, idempotent open, close and reopen", (t) => {
  const directory = mkdtempSync(join(tmpdir(), "marketplace-extension-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  // Only SDK transport is stubbed; real extension, model, HTTP, and lifecycle run.
  const sdk = `
    import assert from "node:assert/strict";
    export class CanvasError extends Error { constructor(code, message) { super(message); this.code = code; } }
    export const createCanvas = (canvas) => canvas;
    export async function joinSession({canvases}) {
      const canvas = canvases[0];
      assert.equal(canvas.id, "marketplace-starter-brainstorm");
      assert.equal(canvas.inputSchema, undefined);
      const ctx = { sessionId: "one", instanceId: "panel" };
      const action = (name, input, context = ctx) => canvas.actions.find(a => a.name === name).handler({...context, input});
      const opened = await canvas.open(ctx);
      try {
        assert.deepEqual(await canvas.open(ctx), opened);
        const page = await fetch(opened.url);
        assert.equal(page.status, 200);
        const saved = await action("save_note", {text:"Think together", column:"ideas"});
        assert.equal((await action("get_board")).notes.length, 1);
        assert.equal((await action("get_board", undefined, {sessionId:"two",instanceId:"panel"})).notes.length, 0);
        await assert.rejects(action("save_note", {text:"", column:"ideas"}), error => error.code === "invalid_note");
        await canvas.onClose(ctx);
        const reopened = await canvas.open(ctx);
        assert.equal((await (await fetch(new URL("/board", reopened.url))).json()).notes[0].text, "Think together");
        await action("save_note", {id:saved.notes[0].id,text:"Act on it",column:"next"});
        assert.equal((await action("get_board")).notes[0].column, "next");
        await action("remove_note", {id:saved.notes[0].id});
        assert.deepEqual(await action("get_board"), {notes:[]});
      } finally { await canvas.onClose(ctx); }
      return {log:async () => {}};
    }
  `;
  const sdkUrl = `data:text/javascript,${encodeURIComponent(sdk)}`;
  const loader = join(directory, "loader.mjs");
  writeFileSync(loader, `export async function resolve(specifier, context, next) {
    if (specifier === "@github/copilot-sdk/extension") return {url:${JSON.stringify(sdkUrl)}, shortCircuit:true};
    return next(specifier, context);
  }`);
  const extension = fileURLToPath(new URL("../plugins/team-brainstorm/com.github.copilot/extensions/brainstorm/extension.mjs", import.meta.url));
  const result = spawnSync(process.execPath, ["--experimental-loader", pathToFileURL(loader).href, extension], {
    encoding: "utf8", timeout: 15_000,
  });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
});
