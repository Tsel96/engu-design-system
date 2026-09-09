#!/usr/bin/env node
// Figma is the source of truth. Read live REST data or an explicit Plugin API
// snapshot; never silently substitute a stale snapshot for a failed live read.
const fs = require("node:fs");
const path = require("node:path");
const ROOT = path.join(__dirname, "..");
const FILE_KEY = "yFUGWRkPWpTU0rDJOqrIBe";
const START = "/* figma:tokens:start */";
const END = "/* figma:tokens:end */";
const ALIASES = {
  "--color-bg-canvas": "--color-bg-default",
  "--color-bg-card": "--color-bg-default",
  "--color-bg-elevated": "--color-bg-default",
  "--color-bg-tinted": "--color-bg-brand-subtle",
  "--color-fg-on-inverse": "--color-fg-inverse",
  "--color-intent-info": "--color-intent-info-icon",
  "--color-intent-success": "--color-intent-success-icon",
  "--color-intent-warning": "--color-intent-warning-icon",
  "--color-intent-error": "--color-intent-error-icon",
};

function cssName(v, collection) {
  if (collection.name === "engu-brand") {
    const match = /^engu-([a-z]+)\/([a-z]+) (\d+)$/i.exec(v.name);
    if (!match) throw new Error(`Unsupported brand variable name: ${v.name}`);
    return `--_${match[1].toLowerCase()}-${match[1] === "overlay" ? match[2].toLowerCase() + "-" : ""}${match[3]}`;
  }
  const name = "--" + v.name.replaceAll("/", "-");
  if (!/^--[a-z][a-z0-9-]*$/.test(name)) throw new Error(`Invalid CSS variable: ${v.name}`);
  return name;
}

function resolve(v, modeName, meta, seen = new Set()) {
  if (seen.has(v.id)) throw new Error(`Circular alias: ${v.name}`);
  seen.add(v.id);
  const collection = meta.variableCollections[v.variableCollectionId];
  if (!collection) throw new Error(`Missing collection for ${v.name}`);
  // Mode IDs are local to a collection. Match the mode by NAME across
  // collections, or use the explicit default of a single-mode collection.
  const mode = collection.modes.find(m => m.name === modeName) ||
    (collection.modes.length === 1 && collection.modes.find(m => m.modeId === collection.defaultModeId));
  if (!mode) throw new Error(`No ${modeName} mode in ${collection.name}`);
  const value = v.valuesByMode[mode.modeId];
  if (value === undefined) throw new Error(`Missing ${modeName} value for ${v.name}`);
  if (value && value.type === "VARIABLE_ALIAS") {
    const target = meta.variables[value.id];
    if (!target) throw new Error(`Missing alias target ${value.id}`);
    return resolve(target, modeName, meta, seen);
  }
  return value;
}

function cssValue(v, value) {
  if (v.resolvedType === "FLOAT" && v.name.startsWith("space/")) {
    if (!Number.isFinite(value) || value < 0) throw new Error(`Invalid spacing: ${v.name}`);
    return `${value}px`;
  }
  if (v.resolvedType !== "COLOR" || !value ||
      ![value.r, value.g, value.b, value.a ?? 1].every(c => Number.isFinite(c) && c >= 0 && c <= 1)) {
    throw new Error(`Invalid color/type: ${v.name}`);
  }
  const rgb = [value.r, value.g, value.b].map(c => Math.round(c * 255));
  if (value.a === undefined || value.a === 1) return "#" + rgb.map(c => c.toString(16).padStart(2, "0")).join("").toUpperCase();
  return `rgba(${rgb.join(",")},${Number(value.a.toFixed(6))})`;
}

function render(data) {
  if (data.source?.fileKey !== FILE_KEY) throw new Error("Snapshot must identify the configured Brand Foundation file");
  const meta = data.meta;
  if (!meta?.variables || !meta?.variableCollections) throw new Error("Incomplete Figma snapshot");
  const light = new Map();
  const dark = new Map();
  for (const name of ["engu-brand", "engu-color-semantic", "engu-spacing"]) {
    const c = Object.values(meta.variableCollections).find(c => c.name === name);
    if (!c || !c.variableIds?.length) throw new Error(`Missing or empty collection: ${name}`);
    if (name === "engu-color-semantic" && !["Light", "Dark"].every(n => c.modes.some(m => m.name === n))) {
      throw new Error("Semantic collection must contain both Light and Dark modes");
    }
    for (const id of c.variableIds) {
      const v = meta.variables[id];
      if (!v || v.variableCollectionId !== c.id) throw new Error(`Missing variable: ${id}`);
      const key = cssName(v, c);
      if (light.has(key)) throw new Error(`Duplicate CSS name: ${key}`);
      light.set(key, cssValue(v, resolve(v, "Light", meta)));
      if (c.modes.length > 1) dark.set(key, cssValue(v, resolve(v, "Dark", meta)));
    }
  }
  for (const [alias, target] of Object.entries(ALIASES)) {
    if (!light.has(target) || light.has(alias)) throw new Error(`Invalid compatibility alias: ${alias}`);
    light.set(alias, `var(${target})`);
    if (dark.has(target)) dark.set(alias, `var(${target})`);
  }
  const lines = (map, indent) => [...map].sort(([a], [b]) => a.localeCompare(b, "en"))
    .map(([key, value]) => `${indent}${key}: ${value};`).join("\n");
  return `${START}\n/* Generated from Figma Brand Foundation. Edit Figma, then re-export. */\n:root {\n${lines(light, "  ")}\n}\n\n@media (prefers-color-scheme: dark) {\n  :root {\n${lines(dark, "    ")}\n  }\n}\n${END}`;
}

function updateCss(css, data) {
  const block = render(data); // Resolve and validate everything before editing.
  const start = css.indexOf(START);
  const end = css.indexOf(END);
  if ((start < 0) !== (end < 0) || (start >= 0 && (end < start || css.indexOf(START, start + 1) >= 0 || css.indexOf(END, end + 1) >= 0))) {
    throw new Error("Malformed generated token markers");
  }
  // Remove old definitions of owned names outside the generated block, too.
  // Otherwise removing a token in Figma could reveal an obsolete CSS fallback.
  const previous = start >= 0 ? css.slice(start, end + END.length) : "";
  const owned = new Set([...block.matchAll(/(--[_a-z0-9-]+):/g), ...previous.matchAll(/(--[_a-z0-9-]+):/g)].map(m => m[1]));
  const clean = text => text.replace(/--[_a-z0-9-]+\s*:[^;{}]+;/g, declaration => {
    const name = declaration.slice(0, declaration.indexOf(":")).trim();
    return owned.has(name) ? "" : declaration;
  }).replace(/[ \t]+$/gm, "").replace(/\n{3,}/g, "\n\n");
  if (start >= 0) return clean(css.slice(0, start)) + block + clean(css.slice(end + END.length));
  return clean(css).trimEnd() + "\n\n" + block + "\n";
}

async function main(args = process.argv.slice(2)) {
  const file = args.indexOf("--input");
  const check = args.includes("--check");
  let data;
  if (file >= 0) {
    if (!args[file + 1] || args[file + 1].startsWith("--")) throw new Error("--input requires a Figma snapshot path");
    data = JSON.parse(fs.readFileSync(args[file + 1], "utf8"));
  } else {
    const token = process.env.FIGMA_TOKEN;
    if (!token) throw new Error("Set FIGMA_TOKEN for Enterprise REST access, or use --input with a fresh Figma Plugin API snapshot. See docs/figma-sync.md.");
    const res = await fetch(`https://api.figma.com/v1/files/${FILE_KEY}/variables/local`, {
      headers: { "X-Figma-Token": token }, signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) throw new Error(`Figma HTTP ${res.status}. Variables REST access requires an Enterprise Full seat and file_variables:read. No files changed. See docs/figma-sync.md.`);
    data = await res.json();
    data.source = { fileKey: FILE_KEY, fileUrl: `https://www.figma.com/design/${FILE_KEY}/Brand-Foundation`, exportedAt: new Date().toISOString(), method: "Figma REST API" };
  }
  const cssPath = path.join(ROOT, "colors_and_type.css");
  const css = fs.readFileSync(cssPath, "utf8");
  const next = updateCss(css, data);
  if (check) {
    if (next !== css) throw new Error("Generated CSS differs from the Figma snapshot. Run npm run build:tokens.");
    console.log("Generated CSS matches the recorded Figma snapshot (not a live freshness check).");
    return;
  }
  if (next !== css) fs.writeFileSync(cssPath, next);
  if (file < 0) {
    const snapshotPath = path.join(ROOT, "tokens/figma-variables.json");
    const prior = fs.existsSync(snapshotPath) ? JSON.parse(fs.readFileSync(snapshotPath, "utf8")) : null;
    if (JSON.stringify(prior?.meta) !== JSON.stringify(data.meta)) fs.writeFileSync(snapshotPath, JSON.stringify(data, null, 2) + "\n");
  }
  console.log(`Generated tokens from Figma (${Object.keys(data.meta.variables).length} variables).`);
}

module.exports = { render, updateCss, resolve };
if (require.main === module) main().catch(error => { console.error(error.message); process.exitCode = 1; });
