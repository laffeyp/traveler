// Semantic rename via the TypeScript language service — the same operation an IDE's
// "rename symbol" performs. Per-symbol, scope-correct, and (findInStrings/Comments=false)
// it never touches string literals or prose. This is what makes it safe to rename
// single-letter locals that regex cannot (multi-meaning per scope, English-word prose).
//
// Usage: node tsrename.mjs <relFile> '<opsJson>'
//   ops = [ { "all": "t", "to": "target" },        // rename EVERY symbol named `t` in the file
//           { "at": [15, 20], "to": "clock" } ]     // rename the one symbol at line:char (1-based)
// Process exception ops (specific `at`) BEFORE the broad `all` op so a differently-meaning
// binding is renamed away first and the `all` sweep no longer sees it.
import ts from "typescript";
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const ROOT = process.cwd();
const [, , relFile, opsJson] = process.argv;
const targetFile = resolve(ROOT, relFile);
const ops = JSON.parse(opsJson);

// Load the project's file set + options from tsconfig.
const configPath = join(ROOT, "tsconfig.json");
const config = ts.readConfigFile(configPath, ts.sys.readFile).config;
const parsed = ts.parseJsonConfigFileContent(config, ts.sys, ROOT);

// In-memory overlay so we can apply successive renames without touching disk until the end.
const overlay = new Map(); // absPath -> { text, version }
function getText(fileName) {
  const abs = resolve(fileName);
  if (overlay.has(abs)) return overlay.get(abs).text;
  return ts.sys.readFile(abs) ?? "";
}
function setText(fileName, text) {
  const abs = resolve(fileName);
  const prev = overlay.get(abs);
  overlay.set(abs, { text, version: (prev?.version ?? 0) + 1 });
}

const host = {
  getScriptFileNames: () => parsed.fileNames,
  getScriptVersion: (f) => String(overlay.get(resolve(f))?.version ?? 0),
  getScriptSnapshot: (f) => {
    const text = getText(f);
    return text === undefined ? undefined : ts.ScriptSnapshot.fromString(text);
  },
  getCurrentDirectory: () => ROOT,
  getCompilationSettings: () => parsed.options,
  getDefaultLibFileName: (o) => ts.getDefaultLibFilePath(o),
  fileExists: ts.sys.fileExists,
  readFile: ts.sys.readFile,
  readDirectory: ts.sys.readDirectory,
  directoryExists: ts.sys.directoryExists,
  getDirectories: ts.sys.getDirectories,
};
const service = ts.createLanguageService(host, ts.createDocumentRegistry());

function applyLocations(locations) {
  const byFile = new Map();
  for (const loc of locations) {
    const abs = resolve(loc.fileName);
    if (!byFile.has(abs)) byFile.set(abs, []);
    byFile.get(abs).push(loc.textSpan);
  }
  for (const [abs, spans] of byFile) {
    let text = getText(abs);
    spans.sort((a, b) => b.start - a.start); // apply back-to-front so offsets stay valid
    for (const span of spans) {
      text = text.slice(0, span.start) + NEW + text.slice(span.start + span.length);
    }
    setText(abs, text);
  }
}

let NEW = "";
function renameAt(fileName, pos, newName) {
  NEW = newName;
  const locs = service.findRenameLocations(fileName, pos, false, false);
  if (!locs || locs.length === 0) return 0;
  applyLocations(locs);
  return locs.length;
}

function offsetOf(text, line, character) {
  const lines = text.split("\n");
  let offset = 0;
  for (let i = 0; i < line - 1; i++) offset += lines[i].length + 1;
  return offset + (character - 1);
}

// Find the first Identifier token named `name` in the current text of the target file.
function firstIdentPos(name) {
  const sf = service.getProgram().getSourceFile(targetFile);
  let found = -1;
  const visit = (node) => {
    if (found !== -1) return;
    if (ts.isIdentifier(node) && node.text === name) {
      found = node.getStart(sf);
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return found;
}

let totalSymbols = 0;
let totalSites = 0;
for (const op of ops) {
  if (op.at) {
    const pos = offsetOf(getText(targetFile), op.at[0], op.at[1]);
    const n = renameAt(targetFile, pos, op.to);
    if (n > 0) {
      totalSymbols++;
      totalSites += n;
    }
    console.log(`  at ${op.at.join(":")} -> ${op.to}  (${n} sites)`);
  } else if (op.near) {
    // Locate a unique substring, then the identifier `op.ident` within it; rename that symbol.
    const text = getText(targetFile);
    const anchor = text.indexOf(op.near);
    if (anchor === -1) {
      console.log(`  near "${op.near}" NOT FOUND — skipped`);
      continue;
    }
    const rel = op.near.search(new RegExp(`\\b${op.ident}\\b`));
    const pos = anchor + rel;
    const n = renameAt(targetFile, pos, op.to);
    if (n > 0) {
      totalSymbols++;
      totalSites += n;
    }
    console.log(`  near "${op.near}" (${op.ident}) -> ${op.to}  (${n} sites)`);
  } else if (op.all) {
    let symbols = 0;
    let sites = 0;
    // Repeatedly rename the first remaining symbol named op.all until none is left.
    for (let guard = 0; guard < 500; guard++) {
      const pos = firstIdentPos(op.all);
      if (pos === -1) break;
      const n = renameAt(targetFile, pos, op.to);
      if (n === 0) break; // safety: could not rename (e.g. not renameable) — stop to avoid a loop
      symbols++;
      sites += n;
    }
    totalSymbols += symbols;
    totalSites += sites;
    console.log(`  all '${op.all}' -> ${op.to}  (${symbols} symbols, ${sites} sites)`);
  }
}

// Write every file the overlay touched.
for (const [abs, { text }] of overlay) writeFileSync(abs, text);
console.log(`done: ${totalSymbols} symbols, ${totalSites} sites across ${overlay.size} file(s)`);
