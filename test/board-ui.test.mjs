import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";

const html = readFileSync(new URL("../plugins/team-brainstorm/com.github.copilot/extensions/brainstorm/index.html", import.meta.url), "utf8");
const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)[1];

// A small DOM contract harness runs the shipped page script without a browser dependency.
function page() {
  const document = { activeElement: undefined };
  class Element {
    constructor(tag) {
      this.tag = tag;
      this.children = [];
      this.dataset = {};
      this.classList = { toggle() {} };
    }
    append(...children) {
      for (const child of children) { child.parent = this; this.children.push(child); }
    }
    contains(element) {
      return this === element || this.children.some((child) => child.contains(element));
    }
    replaceChildren() {
      if (this.contains(document.activeElement)) document.activeElement = document.body;
      for (const child of this.children) child.parent = undefined;
      this.children = [];
    }
    closest(tag) { return this.tag === tag ? this : this.parent?.closest(tag); }
    focus() { document.activeElement = this; }
    setAttribute() {}
  }
  document.body = new Element("body");
  const nodes = Object.fromEntries(["form", "text", "column", "submit", "cancel", "status", "ideas", "questions", "next"]
    .map((id) => [id, new Element(id === "text" ? "textarea" : "div")]));
  document.body.append(...Object.values(nodes));
  nodes.form.reset = () => { nodes.text.value = ""; nodes.column.value = "ideas"; };
  document.querySelector = (selector) => nodes[selector.slice(1)];
  document.getElementById = (id) => nodes[id];
  document.createElement = (tag) => new Element(tag);
  let events;
  runInNewContext(script, {
    document,
    EventSource: class { constructor() { events = this; } },
  });
  return {
    document, nodes,
    update: (notes) => events.onmessage({ data: JSON.stringify({ notes }) }),
    button: (column, action) => nodes[column].children.find((item) => item.dataset.noteId)?.children
      .find((control) => control.dataset.action === action),
  };
}

test("incoming updates preserve keyboard focus on edits and moves, with deletion fallback", () => {
  for (const action of ["edit", "delete"]) {
    const ui = page();
    const note = { id: "one", text: "Keep focus", column: "ideas" };
    ui.update([note]);
    ui.button("ideas", action).focus();
    ui.update([note, { id: "two", text: "From Copilot", column: "questions" }]);
    assert.equal(ui.document.activeElement, ui.button("ideas", action));
    ui.update([{ ...note, column: "next", text: "Moved" }]);
    assert.equal(ui.document.activeElement, ui.button("next", action));
    ui.update([]);
    assert.equal(ui.document.activeElement, ui.nodes.text);
  }
});

test("incoming updates do not steal focus or overwrite an in-progress draft", () => {
  const ui = page();
  ui.nodes.text.value = "Still typing";
  ui.nodes.text.focus();
  ui.update([{ id: "one", text: "From Copilot", column: "ideas" }]);
  assert.equal(ui.document.activeElement, ui.nodes.text);
  assert.equal(ui.nodes.text.value, "Still typing");
});
