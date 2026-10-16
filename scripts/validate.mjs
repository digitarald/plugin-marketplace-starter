import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import Ajv from "ajv/dist/2020.js";
import { parse } from "yaml";

const root = fileURLToPath(new URL("../", import.meta.url));
const json = async (path) => JSON.parse(await readFile(path, "utf8"));
const schema = await json(resolve(root, "scripts/plugin.schema.json"));
const validate = new Ajv({ allErrors: true }).compile(schema);
const catalog = await json(resolve(root, "marketplace.json"));
assert.match(catalog.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
assert.ok(catalog.owner?.name);
assert.ok(catalog.plugins?.length > 0);
const names = new Set();
let skillCount = 0;

async function files(path) {
  const entries = await readdir(path, { withFileTypes: true });
  return (await Promise.all(entries.filter((entry) => ![".git", "node_modules"].includes(entry.name))
    .map((entry) => entry.isDirectory() ? files(resolve(path, entry.name)) : resolve(path, entry.name)))).flat();
}

for (const entry of catalog.plugins) {
  assert.ok(!names.has(entry.name), `Duplicate plugin: ${entry.name}`);
  names.add(entry.name);
  assert.equal(typeof entry.source, "string");
  assert.ok(entry.source.startsWith("./plugins/"));
  const directory = resolve(root, entry.source);
  assert.ok(relative(resolve(root, "plugins"), directory).split(sep).every((part) => part !== ".."));
  const manifest = await json(resolve(directory, "plugin.json"));
  assert.ok(validate(manifest), `${entry.name}: ${JSON.stringify(validate.errors)}`);
  assert.equal(manifest.name, entry.name);
  assert.equal(manifest.version, entry.version);
  assert.equal(manifest.description, entry.description);
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.ok((await readFile(resolve(directory, "CHANGELOG.md"), "utf8")).includes(`## ${manifest.version}\n`));
  await stat(resolve(directory, "README.md"));
  for (const file of await files(directory)) {
    assert.ok(![".plugin", ".claude-plugin"].some((name) => file.includes(`${sep}${name}${sep}`)), "Use Agent Plugins 1.0 layout.");
    if (file.endsWith(`${sep}SKILL.md`)) {
      skillCount++;
      const markdown = await readFile(file, "utf8");
      const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
      assert.ok(match, `${file}: YAML frontmatter is required`);
      const meta = parse(match[1], { uniqueKeys: true });
      assert.match(meta.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
      assert.ok(meta.name.length <= 64);
      assert.equal(meta.name, file.split(sep).at(-2));
      assert.equal(typeof meta.description, "string");
      assert.ok(meta.description.length > 0 && meta.description.length <= 1024);
    }
    if (file.endsWith("hooks.json")) {
      assert.equal(relative(directory, file).split(sep).join("/"), "com.github.copilot/hooks/hooks.json");
      const hooks = await json(file);
      assert.equal(hooks.version, 1);
      assert.ok(hooks.hooks && Object.keys(hooks.hooks).length);
      for (const [event, commands] of Object.entries(hooks.hooks)) {
        assert.ok(["preToolUse", "postToolUse"].includes(event), `Unsupported starter hook event: ${event}`);
        assert.ok(Array.isArray(commands) && commands.length);
        for (const hook of commands) {
          assert.equal(hook.type, "command");
          assert.ok(Number.isFinite(hook.timeoutSec) && hook.timeoutSec > 0);
          const script = hook.command.match(/^node "\$\{PLUGIN_ROOT\}\/([^"]+)"$/)?.[1];
          assert.ok(script, "Hook must use a quoted plugin-relative script.");
          assert.ok(!relative(directory, resolve(directory, script)).split(sep).includes(".."));
          await stat(resolve(directory, script));
        }
      }
    }
  }
}
assert.ok(skillCount <= 2, "Keep the starter to at most two skills.");
const actualPlugins = (await readdir(resolve(root, "plugins"), { withFileTypes: true }))
  .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
assert.deepEqual(actualPlugins, [...names].sort(), "Every plugin must be registered.");
const settings = await json(resolve(root, ".github/copilot/settings.json"));
assert.deepEqual(settings.extraKnownMarketplaces, {
  [catalog.name]: { source: { source: "directory", path: "." } },
}, "The repository marketplace must point at this checkout.");
assert.deepEqual(settings.enabledPlugins, Object.fromEntries(
  [...names].map((name) => [`${name}@${catalog.name}`, true]),
), "Enable every catalog plugin in the repository overlay.");
for (const file of await files(root)) {
  if (file.endsWith(".mjs")) {
    const check = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    assert.equal(check.status, 0, check.stderr || check.error?.message);
  }
  if (file.endsWith(".md")) {
    for (const match of (await readFile(file, "utf8")).matchAll(/\]\(([^)\s]+)\)/g)) {
      if (/^(?:https?:|#)/.test(match[1])) continue;
      const target = resolve(file, "..", match[1].split("#")[0]);
      await stat(target);
    }
  }
}
console.log(`Validated ${names.size} plugins and ${skillCount} skills.`);
