import { lstatSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { extname, isAbsolute, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";

const pathFields = {
  create: "path",
  edit: "path",
  create_file: "filePath",
  replace_string_in_file: "filePath",
};

function filePath(value) {
  if (typeof value !== "string" || !value.trim()) throw new Error("Expected a non-empty file path.");
  return value;
}

function patchPaths(patch) {
  if (typeof patch !== "string" || !patch.startsWith("*** Begin Patch")
    || !patch.trimEnd().endsWith("*** End Patch")) {
    throw new Error("Expected an apply_patch patch.");
  }
  const paths = [];
  let current;
  for (const line of patch.split(/\r?\n/)) {
    const header = line.match(/^\*\*\* (Add|Update|Delete) File: (.+)$/);
    if (header || line === "*** End Patch") {
      if (current) paths.push(current);
      current = header && header[1] !== "Delete" ? filePath(header[2]) : undefined;
    } else if (line.startsWith("*** Move to: ") && current) {
      current = filePath(line.slice("*** Move to: ".length));
    }
  }
  return paths;
}

function affectedPaths(name, args) {
  if (typeof args === "string" && !(name === "apply_patch" && args.startsWith("*** Begin Patch"))) {
    args = JSON.parse(args);
  }
  if (name === "apply_patch") return patchPaths(typeof args === "string" ? args : args?.input ?? args?.patch);
  if (!args || typeof args !== "object" || Array.isArray(args)) throw new Error("Expected toolArgs object.");
  if (name === "multi_replace_string_in_file") {
    if (!Array.isArray(args.replacements)) throw new Error("Expected replacements array.");
    return args.replacements.map((replacement) => filePath(replacement?.filePath));
  }
  return [filePath(args[pathFields[name]])];
}

export function format(event, diagnostic = console.error) {
  const messages = [];
  const report = (message) => {
    const text = `format-json: ${message}`;
    messages.push(text);
    diagnostic(text);
  };
  try {
    if (!event || typeof event.toolName !== "string") throw new Error("Expected a shared-runtime tool event.");
    const name = event.toolName;
    if (!Object.hasOwn(pathFields, name) && !["multi_replace_string_in_file", "apply_patch"].includes(name)) return {};
    if (event.toolResult?.resultType !== "success") return {};
    if (typeof event.cwd !== "string" || !isAbsolute(event.cwd)) throw new Error("Expected an absolute event cwd.");
    const paths = [...new Set(affectedPaths(name, event.toolArgs).map((path) => resolve(event.cwd, path)))];
    for (const path of paths) {
      if (extname(path).toLowerCase() !== ".json") continue;
      try {
        const local = relative(event.cwd, path);
        if (isAbsolute(local) || local.split(sep).includes("..")) throw new Error("File is outside the session working directory.");
        if (!lstatSync(path).isFile()) throw new Error("Expected a regular file, not a directory or symbolic link.");
        const actual = relative(realpathSync(event.cwd), realpathSync(path));
        if (isAbsolute(actual) || actual.split(sep).includes("..")) throw new Error("File resolves outside the session working directory.");
        const before = readFileSync(path, "utf8");
        const after = `${JSON.stringify(JSON.parse(before), null, 2)}\n`;
        if (before !== after) {
          writeFileSync(path, after);
          messages.push(`format-json: Formatted ${path}. Re-read it before further edits.`);
        }
      } catch (error) {
        report(`${path}: ${error.message}`);
      }
    }
  } catch (error) {
    report(error.message);
  }
  return messages.length ? { additionalContext: messages.join("\n") } : {};
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let result;
  try {
    result = format(JSON.parse(readFileSync(0, "utf8")));
  } catch (error) {
    const message = `format-json: Invalid hook input: ${error.message}`;
    console.error(message);
    result = { additionalContext: message };
  }
  process.stdout.write(`${JSON.stringify(result)}\n`);
}
