#!/usr/bin/env node
/**
 * Syncs assets/icons/{engu-icons.json,engu-icons-sprite.svg,engu-icons-browse.html}
 * from the live Icons/{Category}/{name} component sets in the Engu Figma file.
 *
 * Existing hand-curated aliases (assets/icons/engu-icons.json) are preserved for
 * icons that still exist; new icons default to a single alias (their own name).
 * Icons removed from Figma are dropped from all three output files.
 *
 * Requires FIGMA_TOKEN env var (personal access token).
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const FILE_KEY = "92ZwLCANCyRKezlcuQLOBW";
const ICONS_DIR = path.join(__dirname, "..", "assets", "icons");
const JSON_PATH = path.join(ICONS_DIR, "engu-icons.json");
const SPRITE_PATH = path.join(ICONS_DIR, "engu-icons-sprite.svg");
const BROWSE_PATH = path.join(ICONS_DIR, "engu-icons-browse.html");
const OUTLINED_24 = "Size=24, Style=Outlined";

const token = process.env.FIGMA_TOKEN;
if (!token) {
  console.error("Error: FIGMA_TOKEN env var is required.");
  process.exit(1);
}

function get(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { "X-Figma-Token": token } }, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}: ${body.slice(0, 300)}`));
        } else {
          resolve(JSON.parse(body));
        }
      });
    });
    req.on("error", reject);
  });
}

function getText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve(body));
      })
      .on("error", reject);
  });
}

async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Variant property order isn't guaranteed to match across component sets
// (it follows each set's own property-definition order), so parse into a
// map rather than comparing the raw "Size=24, Style=Outlined" string.
function parseVariantProps(variantName) {
  const props = {};
  for (const part of variantName.split(",")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim().toLowerCase();
    const value = part.slice(idx + 1).trim().toLowerCase();
    props[key] = value;
  }
  return props;
}

// Picks the "Size=24, Style=Outlined" child for a normal icon. Single-style
// icons (brand/logo marks, which don't have an outlined/solid distinction)
// only carry a "Size" property with no "Style" at all — for those, fall back
// to whichever child is just Size=24, rather than treating them as missing.
function pickOutlined24(children) {
  const outlined = children.find((ch) => {
    const props = parseVariantProps(ch.name);
    return props.size === "24" && props.style === "outlined";
  });
  if (outlined) return outlined;

  const hasStyleProp = children.some((ch) => parseVariantProps(ch.name).style !== undefined);
  if (hasStyleProp) return null; // a real Style axis exists but only non-Outlined variants do (e.g. Solid-only) — skip

  return children.find((ch) => parseVariantProps(ch.name).size === "24") || null;
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function extractInnerSvg(svgText) {
  const openMatch = svgText.match(/<svg\b[^>]*>/i);
  const closeIdx = svgText.lastIndexOf("</svg>");
  if (!openMatch || closeIdx === -1) return null;
  const start = openMatch.index + openMatch[0].length;
  return svgText.slice(start, closeIdx).trim();
}

async function main() {
  console.log(`Fetching component sets from file ${FILE_KEY}…`);
  const setData = await get(`https://api.figma.com/v1/files/${FILE_KEY}/component_sets`);
  const sets = (setData.meta?.component_sets ?? []).filter((c) => /^Icons\/[^/]+\/.+/.test(c.name));

  // Resolve each set's "Size=24, Style=Outlined" child via /v1/files/:key/nodes rather than
  // the file-scoped /components endpoint, which paginates on files this large and silently
  // truncates (previously matched only ~63% of icons with no error).
  console.log(`Resolving outlined-24 variant for ${sets.length} icon component sets…`);
  const setBatches = chunk(sets, 150);
  const childBySetId = {};
  const childNamesBySetId = {};
  const visibleBySetId = {};
  for (const batch of setBatches) {
    const data = await get(`https://api.figma.com/v1/files/${FILE_KEY}/nodes?ids=${batch.map((s) => s.node_id).join(",")}`);
    for (const [nodeId, entry] of Object.entries(data.nodes || {})) {
      const children = entry?.document?.children || [];
      childNamesBySetId[nodeId] = children.map((ch) => ch.name);
      visibleBySetId[nodeId] = entry?.document?.visible !== false;
      const outlined = pickOutlined24(children);
      if (outlined) childBySetId[nodeId] = outlined.id;
    }
  }

  // The file has leftover hidden/duplicate component sets that reuse the exact
  // "Icons/{Category}/{name}" name of a real, current icon (edit history cruft
  // Figma keeps around). Dedupe by name, preferring a visible set that actually
  // resolves an outlined-24 child over a stale/hidden one that doesn't.
  const bestByKey = new Map(); // "category/name" -> set
  for (const set of sets) {
    const key = set.name;
    const visible = visibleBySetId[set.node_id] !== false;
    const resolved = Boolean(childBySetId[set.node_id]);
    const existing = bestByKey.get(key);
    if (!existing) {
      bestByKey.set(key, set);
      continue;
    }
    const existingVisible = visibleBySetId[existing.node_id] !== false;
    const existingResolved = Boolean(childBySetId[existing.node_id]);
    const better = (visible && !existingVisible) || (visible === existingVisible && resolved && !existingResolved);
    if (better) bestByKey.set(key, set);
  }

  const icons = []; // { category, name, nodeId }
  const missingVariant = [];
  for (const set of bestByKey.values()) {
    const parts = set.name.split("/"); // ["Icons", "Category", "icon-name"]
    const category = parts[1];
    const name = parts.slice(2).join("/").trim();
    const outlinedNodeId = childBySetId[set.node_id];
    if (!outlinedNodeId) {
      missingVariant.push({ name: set.name, children: childNamesBySetId[set.node_id] });
      continue;
    }
    icons.push({ category, name, nodeId: outlinedNodeId });
  }

  console.log(`Found ${icons.length} icons across ${new Set(icons.map((i) => i.category)).size} categories.`);

  const priorCount = (() => {
    try {
      return JSON.parse(fs.readFileSync(JSON_PATH, "utf8")).length;
    } catch {
      return 0;
    }
  })();
  if (icons.length === 0 || (priorCount > 0 && icons.length < priorCount * 0.9)) {
    console.error(
      `Refusing to write output: resolved ${icons.length} icons vs ${priorCount} previously. ` +
        `This looks like an API/matching failure, not a real icon-set shrink. Leaving existing files untouched.`
    );
    if (missingVariant.length) {
      console.error(`Sample of unresolved sets (with their actual variant child names):`);
      missingVariant.slice(0, 10).forEach((m) => console.error(`  - ${m.name}: [${(m.children || []).join(" | ")}]`));
    }
    process.exit(1);
  }

  if (missingVariant.length) {
    console.warn(`Skipped ${missingVariant.length} icon(s) with no "${OUTLINED_24}" variant:`);
    missingVariant.slice(0, 20).forEach((m) => console.warn(`  - ${m.name}: [${(m.children || []).join(" | ")}]`));
  }

  // Bulk-resolve export URLs for the outlined-24 node of every icon.
  const idBatches = chunk(icons.map((i) => i.nodeId), 200);
  const urlByNodeId = {};
  for (const batch of idBatches) {
    const data = await get(`https://api.figma.com/v1/images/${FILE_KEY}?ids=${batch.join(",")}&format=svg`);
    Object.assign(urlByNodeId, data.images || {});
  }

  console.log("Downloading SVG markup for each icon…");
  const svgByNodeId = {};
  await mapWithConcurrency(icons, 20, async (icon) => {
    const url = urlByNodeId[icon.nodeId];
    if (!url) {
      console.warn(`  ! no export URL for ${icon.category}/${icon.name} (${icon.nodeId})`);
      return;
    }
    const raw = await getText(url);
    const inner = extractInnerSvg(raw);
    if (!inner) {
      console.warn(`  ! could not parse SVG for ${icon.category}/${icon.name}`);
      return;
    }
    svgByNodeId[icon.nodeId] = inner;
  });

  // Load existing manifest to preserve hand-curated aliases.
  let existing = [];
  try {
    existing = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));
  } catch {
    // no existing manifest — fine, starting fresh
  }
  const existingBySlug = new Map(existing.map((e) => [e.slug, e]));

  const resolvedIcons = icons
    .filter((i) => svgByNodeId[i.nodeId])
    .sort((a, b) => (a.category === b.category ? a.name.localeCompare(b.name) : a.category.localeCompare(b.category)));

  const manifest = resolvedIcons.map((icon) => {
    const prior = existingBySlug.get(icon.name);
    return {
      name: icon.name,
      slug: icon.name,
      aliases: prior?.aliases?.length ? prior.aliases : [icon.name],
      category: icon.category,
    };
  });

  const removed = existing.filter((e) => !resolvedIcons.some((i) => i.name === e.slug));
  const added = manifest.filter((m) => !existingBySlug.has(m.slug));
  console.log(`Manifest: ${manifest.length} icons (+${added.length} new, -${removed.length} removed).`);
  if (added.length) console.log(`  new: ${added.map((a) => a.slug).join(", ")}`);
  if (removed.length) console.log(`  removed: ${removed.map((r) => r.slug).join(", ")}`);

  fs.writeFileSync(JSON_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf8");

  // --- sprite ---
  const symbols = resolvedIcons
    .map((icon) => `<symbol id="engu-${icon.name}" viewBox="0 0 24 24" fill="none">${svgByNodeId[icon.nodeId]}</symbol>`)
    .join("\n");
  const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">\n${symbols}\n</svg>\n`;
  fs.writeFileSync(SPRITE_PATH, sprite, "utf8");

  // --- browse html (regenerate <main>…</main>, keep the rest of the page shell) ---
  const byCategory = {};
  for (const m of manifest) (byCategory[m.category] ??= []).push(m);

  const sections = Object.entries(byCategory)
    .map(([category, list]) => {
      const tiles = list
        .map(
          (icon) => `    <div class="tile" data-name="${escapeHtml(icon.name)}" data-aliases="${escapeHtml(icon.aliases.join(" "))}" tabindex="0" title="${escapeHtml(icon.name)}">
      <svg viewBox="0 0 24 24" fill="none"><use href="engu-icons-sprite.svg#engu-${icon.name}"/></svg>
      <span class="lbl">${escapeHtml(icon.name)}</span>
    </div>`
        )
        .join("\n");
      return `<section data-cat="${escapeHtml(category)}">
  <h2>${escapeHtml(category)} <span class="count">${list.length}</span></h2>
  <div class="grid">
${tiles}</div>
</section>`;
    })
    .join("\n");
  const main = `<main>${sections}</main>`;

  const browseHtml = fs.readFileSync(BROWSE_PATH, "utf8");
  const mainStart = browseHtml.indexOf("<main>");
  const mainEnd = browseHtml.indexOf("</main>") + "</main>".length;
  if (mainStart === -1 || mainEnd === -1) {
    throw new Error("Could not locate <main>…</main> block in engu-icons-browse.html");
  }
  let updated = browseHtml.slice(0, mainStart) + main + browseHtml.slice(mainEnd);
  updated = updated.replace(
    /class="stat">[^<]*</,
    `class="stat">${manifest.length} icons · ${Object.keys(byCategory).length} categories · 2px stroke · round caps<`
  );
  fs.writeFileSync(BROWSE_PATH, updated, "utf8");

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err.stack || err.message);
  process.exit(1);
});
