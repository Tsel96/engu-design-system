#!/usr/bin/env node
/**
 * Reads --color-* custom properties from colors_and_type.css and pushes
 * them back into the "engu-color-semantic" Figma variable collection via
 * the Variables REST API.
 *
 * CSS var name → Figma variable name:
 *   "--color-bg-default" → "color/bg/default"  (strips "--", replaces "-" with "/")
 *
 * Parses light values from :root { } and dark values from
 *   @media (prefers-color-scheme: dark) { :root { } }
 * and updates the matching Light / Dark modes in Figma.
 *
 * Only updates variables that already exist in the collection.
 * Prints each variable name as it is updated.
 *
 * Requires:
 *   FIGMA_TOKEN    — Figma personal access token (file_variables:read + write scope)
 *   FIGMA_FILE_KEY — Figma file key (default: yFUGWRkPWpTU0rDJOqrIBe)
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const TOKEN = process.env.FIGMA_TOKEN;
const FILE_KEY = process.env.FIGMA_FILE_KEY || "yFUGWRkPWpTU0rDJOqrIBe";
const CSS_PATH = path.join(__dirname, "..", "colors_and_type.css");
const COLLECTION_NAME = "engu-color-semantic";
const LIGHT_MODE = "Light";
const DARK_MODE = "Dark";

if (!TOKEN) {
  console.error("Error: FIGMA_TOKEN env var is required (needs file_variables:read + write scopes).");
  process.exit(1);
}

// ─── HTTP helpers ─────────────────────────────────────────────────────────────

function request(method, url, body) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        "X-Figma-Token": TOKEN,
        "Content-Type": "application/json",
        ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
      },
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 300)}`));
        } else {
          resolve(data ? JSON.parse(data) : {});
        }
      });
    });
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

const get = (url) => request("GET", url, null);
const post = (url, body) => request("POST", url, body);

// ─── CSS → color value parsers ────────────────────────────────────────────────

/** Parses "#RRGGBB" or "#RRGGBBAA" hex strings to Figma { r, g, b, a }. */
function hexToFigma(hex) {
  const h = hex.replace("#", "");
  const parse = (s, i) => parseInt(s.slice(i, i + 2), 16) / 255;
  return {
    r: parse(h, 0),
    g: parse(h, 2),
    b: parse(h, 4),
    a: h.length === 8 ? parse(h, 6) : 1,
  };
}

/** Parses "rgba(r,g,b,a)" to Figma { r, g, b, a }. */
function rgbaToFigma(rgba) {
  const m = rgba.match(/rgba?\(\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\s*\)/);
  if (!m) throw new Error(`Cannot parse color value: ${rgba}`);
  return {
    r: Number(m[1]) / 255,
    g: Number(m[2]) / 255,
    b: Number(m[3]) / 255,
    a: m[4] !== undefined ? Number(m[4]) : 1,
  };
}

function cssValueToFigma(value) {
  const v = value.trim();
  if (v.startsWith("#")) return hexToFigma(v);
  if (v.startsWith("rgb")) return rgbaToFigma(v);
  return null; // alias (var(--…)) or non-color — skip
}

// ─── CSS var name ↔ Figma variable name ───────────────────────────────────────

/**
 * "--color-bg-default" → "color/bg/default"
 * Strips the leading "--", then replaces every "-" that is NOT between two
 * digits or inside a known CSS keyword with "/".
 * Simple heuristic: split on "-" and rejoin with "/", then post-process any
 * segments that were originally hyphenated numbers (e.g. "rgba" args won't
 * appear here since we only handle custom property names, not values).
 */
function cssVarToFigmaName(cssVar) {
  return cssVar.replace(/^--/, "").replace(/-/g, "/");
}

// ─── CSS parser ───────────────────────────────────────────────────────────────

const COLOR_VAR_RE = /^\s*(--color-[a-z0-9-]+)\s*:\s*([^;/]+?)\s*;/;

/**
 * Extracts all --color-* declarations from a CSS block string.
 * Returns Map<cssVarName, rawValue>.
 */
function extractColorVars(block) {
  const map = new Map();
  for (const line of block.split("\n")) {
    const m = line.match(COLOR_VAR_RE);
    if (m) map.set(m[1], m[2]);
  }
  return map;
}

/** Extract the content of :root { } from a CSS string. */
function extractRootBlock(css) {
  const start = css.indexOf(":root {");
  if (start === -1) return "";
  let depth = 0;
  let i = start;
  while (i < css.length) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      depth--;
      if (depth === 0) return css.slice(start, i + 1);
    }
    i++;
  }
  return "";
}

/** Extract the content of @media (prefers-color-scheme: dark) { :root { } }. */
function extractDarkRootBlock(css) {
  const mediaStart = css.indexOf("prefers-color-scheme: dark");
  if (mediaStart === -1) return "";
  return extractRootBlock(css.slice(mediaStart));
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const css = fs.readFileSync(CSS_PATH, "utf8");

  // Parse light and dark tokens from CSS
  const lightBlock = extractRootBlock(css);
  const darkBlock = extractDarkRootBlock(css);
  const lightVars = extractColorVars(lightBlock);
  const darkVars = extractColorVars(darkBlock);

  console.log(`Parsed ${lightVars.size} light and ${darkVars.size} dark color vars from CSS.`);

  // Fetch Figma variable metadata
  console.log(`Fetching variables from file ${FILE_KEY}…`);
  const data = await get(`https://api.figma.com/v1/files/${FILE_KEY}/variables/local`);

  const allVars = data.meta?.variables ?? {};
  const allCollections = data.meta?.variableCollections ?? {};

  const collection = Object.values(allCollections).find(
    (c) => c.name === COLLECTION_NAME
  );
  if (!collection) {
    const names = Object.values(allCollections).map((c) => c.name).join(", ");
    throw new Error(`Collection "${COLLECTION_NAME}" not found. Available: ${names}`);
  }

  const lightMode = collection.modes.find((m) => m.name === LIGHT_MODE);
  const darkMode = collection.modes.find((m) => m.name === DARK_MODE);
  if (!lightMode) throw new Error(`Mode "${LIGHT_MODE}" not found in collection`);
  if (!darkMode) console.warn(`Warning: Mode "${DARK_MODE}" not found — dark values will be skipped`);

  // Build a lookup: figmaVarName → variable object
  const figmaVarsByName = {};
  for (const v of Object.values(allVars)) {
    if (v.variableCollectionId === collection.id) {
      figmaVarsByName[v.name] = v;
    }
  }

  // Build the variables update payload
  const updates = [];
  let skipped = 0;

  function addUpdate(cssVar, rawValue, modeId, modeName) {
    const figmaName = cssVarToFigmaName(cssVar);
    const figmaVar = figmaVarsByName[figmaName];
    if (!figmaVar) {
      // Try a fallback: maybe the name uses a different separator convention
      skipped++;
      return;
    }
    const color = cssValueToFigma(rawValue);
    if (!color) return; // alias or unsupported value

    console.log(`  ↑ ${figmaName}  [${modeName}]  ${rawValue}`);
    updates.push({
      action: "UPDATE",
      id: figmaVar.id,
      valuesByMode: { [modeId]: color },
    });
  }

  for (const [cssVar, value] of lightVars) {
    addUpdate(cssVar, value, lightMode.modeId, LIGHT_MODE);
  }
  if (darkMode) {
    for (const [cssVar, value] of darkVars) {
      addUpdate(cssVar, value, darkMode.modeId, DARK_MODE);
    }
  }

  if (updates.length === 0) {
    console.log("No matching variables found to update.");
    if (skipped > 0) {
      console.warn(`${skipped} CSS vars had no matching Figma variable (name mismatch?).`);
    }
    return;
  }

  // Merge multiple mode updates for the same variable into one entry
  const merged = {};
  for (const u of updates) {
    if (!merged[u.id]) merged[u.id] = { action: "UPDATE", id: u.id, valuesByMode: {} };
    Object.assign(merged[u.id].valuesByMode, u.valuesByMode);
  }

  console.log(`\nPushing ${Object.keys(merged).length} variable updates to Figma…`);
  await post(`https://api.figma.com/v1/files/${FILE_KEY}/variables`, {
    variables: Object.values(merged),
  });

  console.log(`\n✓ Done. ${Object.keys(merged).length} variables updated.`);
  if (skipped > 0) {
    console.warn(`${skipped} CSS vars skipped (no matching Figma variable).`);
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
