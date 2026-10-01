#!/usr/bin/env node
/** Build small, on-demand icon assets from the recorded Figma export. */
const fs = require('node:fs');
const path = require('node:path');

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

function categoryKey(name) {
  return name.toLowerCase().replace(/&/g, '-').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function assertSafeSlug(slug) {
  if (typeof slug !== 'string' || !slug || slug === '.' || slug === '..' ||
      /[<>:"/\\|?*\u0000-\u001f]/.test(slug) || /[. ]$/.test(slug) ||
      /^(?:con|prn|aux|nul|com[1-9\u00b9\u00b2\u00b3]|lpt[1-9\u00b9\u00b2\u00b3])(?:\.|$)/i.test(slug)) {
    throw new Error(`Unsafe icon slug: ${JSON.stringify(slug)}`);
  }
}

function iconPath(icon) {
  assertSafeSlug(icon.slug);
  if (typeof icon.category !== 'string' || !categoryKey(icon.category)) {
    throw new Error(`Invalid icon category: ${JSON.stringify(icon.category)}`);
  }
  return `svg/${categoryKey(icon.category)}/${icon.slug}.svg`;
}

function decodeXml(value) {
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  return value.replace(/&(amp|lt|gt|quot|apos|#\d+|#x[\da-f]+);/gi, (_, entity) => {
    if (entity[0] !== '#') return entities[entity.toLowerCase()];
    const code = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    if (!Number.isInteger(code) || code <= 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) {
      throw new Error('Invalid XML character reference in sprite');
    }
    return String.fromCodePoint(code);
  });
}

function attributes(text) {
  const result = new Map();
  for (const match of text.matchAll(/(?:^|\s)([\w:.-]+)\s*=\s*(["'])([\s\S]*?)\2/g)) {
    if (result.has(match[1])) throw new Error(`Duplicate SVG attribute: ${match[1]}`);
    result.set(match[1], decodeXml(match[3]));
  }
  return result;
}

function parseSymbols(sprite) {
  if (typeof sprite !== 'string') throw new Error('Icon sprite must be UTF-8 text');
  const normalized = sprite.replace(/\r\n?/g, '\n');
  const ids = new Set();
  // Inspect IDs on every element, including clip paths and other nested defs.
  const tags = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<![^>]*>|<\/?[A-Za-z_][\w.:-]*(?:"[^"]*"|'[^']*'|[^'">])*>/g;
  for (const match of normalized.matchAll(tags)) {
    if (/^<[/!?]/.test(match[0])) continue;
    const tag = match[0].match(/^<[\w.:-]+([\s\S]*?)\/?\s*>$/);
    const id = attributes(tag[1]).get('id');
    if (id === undefined) continue;
    if (ids.has(id)) throw new Error(`Duplicate SVG ID: ${id}`);
    ids.add(id);
  }

  const symbols = new Map();
  const pattern = /<symbol\b((?:"[^"]*"|'[^']*'|[^'">])*)>([\s\S]*?)<\/symbol\s*>/g;
  for (const match of normalized.matchAll(pattern)) {
    const attrs = attributes(match[1]);
    const id = attrs.get('id');
    if (!id) throw new Error('Sprite symbol has no ID');
    if (symbols.has(id)) throw new Error(`Duplicate sprite symbol: ${id}`);
    if (attrs.has('xmlns') && attrs.get('xmlns') !== SVG_NAMESPACE) {
      throw new Error(`Unexpected SVG namespace on symbol: ${id}`);
    }
    const namespace = attrs.has('xmlns') ? '' : ` xmlns="${SVG_NAMESPACE}"`;
    symbols.set(id, `<svg${namespace}${match[1]}>${match[2]}</svg>\n`);
  }
  const starts = (normalized.match(/<symbol\b/g) || []).length;
  if (starts !== symbols.size) throw new Error('Malformed or nested sprite symbols');
  return symbols;
}

function createIconAssets(manifest, sprite) {
  if (!Array.isArray(manifest)) throw new Error('Icon manifest must be an array');
  const categories = new Map();
  const categoryNames = new Map();
  const slugs = new Set();
  const filenames = new Set();
  const symbols = parseSymbols(sprite);
  const assets = new Map();

  for (const icon of manifest) {
    if (!icon || typeof icon.name !== 'string' || !icon.name ||
        !Array.isArray(icon.aliases) || icon.aliases.some(alias => typeof alias !== 'string')) {
      throw new Error('Invalid icon manifest record');
    }
    if (icon.variant !== undefined && (!icon.variant || Array.isArray(icon.variant) ||
        typeof icon.variant !== 'object' || icon.variant.size !== 24 ||
        !['Outlined', 'Solid'].includes(icon.variant.style) ||
        typeof icon.variant.nodeId !== 'string' || !icon.variant.nodeId ||
        /\s/.test(icon.variant.nodeId))) {
      throw new Error(`Invalid icon variant metadata: ${icon.name}`);
    }
    const relative = iconPath(icon);
    if (filenames.has(relative.toLowerCase())) throw new Error(`Icon filename collision: ${relative}`);
    filenames.add(relative.toLowerCase());
    const key = categoryKey(icon.category);
    if (categoryNames.has(key) && categoryNames.get(key) !== icon.category) {
      throw new Error(`Category key collision: ${categoryNames.get(key)} and ${icon.category}`);
    }
    categoryNames.set(key, icon.category);
    if (slugs.has(icon.slug)) throw new Error(`Duplicate icon slug: ${icon.slug}`);
    slugs.add(icon.slug);
    const id = `engu-${icon.slug}`;
    if (!symbols.has(id)) throw new Error(`Missing sprite symbol: ${id}`);
    assets.set(relative, symbols.get(id));
    symbols.delete(id);
    if (!categories.has(icon.category)) categories.set(icon.category, []);
    categories.get(icon.category).push({
      name: icon.name, slug: icon.slug, aliases: icon.aliases, category: icon.category,
      ...(icon.variant === undefined ? {} : { variant: icon.variant }),
    });
  }
  if (symbols.size) throw new Error(`Unmatched sprite symbol: ${symbols.keys().next().value}`);

  const directory = [];
  for (const [name, icons] of categories) {
    const key = categoryKey(name);
    const catalog = `catalog/${key}.jsonl`;
    assets.set(catalog, icons.map(icon => JSON.stringify(icon)).join('\n') + '\n');
    directory.push({ name, count: icons.length, catalog, svgDirectory: `svg/${key}` });
  }
  assets.set('index.json', JSON.stringify({
    version: 1, count: manifest.length, sprite: 'engu-icons-sprite.svg', categories: directory,
  }, null, 2) + '\n');
  return assets;
}

function containedPath(root, relative) {
  if (typeof relative !== 'string' || path.isAbsolute(relative) || relative.includes('\\')) {
    throw new Error(`Unsafe generated asset path: ${JSON.stringify(relative)}`);
  }
  const parts = relative.split('/');
  if (parts.some(part => !part || part === '.' || part === '..')) {
    throw new Error(`Unsafe generated asset path: ${relative}`);
  }
  const target = path.resolve(root, ...parts);
  const resolvedRelative = path.relative(root, target);
  if (!resolvedRelative || resolvedRelative.startsWith(`..${path.sep}`) || resolvedRelative === '..' || path.isAbsolute(resolvedRelative)) {
    throw new Error(`Generated asset escapes icon directory: ${relative}`);
  }
  // Refuse symlinks rather than following them to a location outside this tree.
  let current = root;
  for (const part of ['', ...parts]) {
    if (part) current = path.join(current, part);
    let stat;
    try { stat = fs.lstatSync(current); } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    if (stat.isSymbolicLink()) throw new Error(`Generated asset path is a symlink: ${relative}`);
  }
  return target;
}

function assertGeneratedPath(relative) {
  if (relative === 'index.json') return;
  const parts = relative.split('/');
  if (parts.length === 2 && parts[0] === 'catalog' && /^[a-z0-9]+(?:-[a-z0-9]+)*\.jsonl$/.test(parts[1])) return;
  if (parts.length === 3 && parts[0] === 'svg' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(parts[1]) && parts[2].endsWith('.svg')) {
    assertSafeSlug(parts[2].slice(0, -4));
    return;
  }
  throw new Error(`Unexpected generated asset path: ${relative}`);
}

function generatedFiles(root, directory, extension) {
  const found = [];
  const initial = containedPath(root, directory);
  if (!fs.existsSync(initial)) return found;
  function visit(relative) {
    const target = containedPath(root, relative);
    for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
      const child = `${relative}/${entry.name}`;
      if (entry.isSymbolicLink()) {
        if (entry.name.endsWith(extension)) throw new Error(`Generated asset is a symlink: ${child}`);
        continue;
      }
      if (entry.isDirectory()) visit(child);
      else if (entry.isFile() && entry.name.endsWith(extension)) found.push(child);
    }
  }
  visit(directory);
  return found;
}

function writeIconAssets(assets, iconsDir, { check = false } = {}) {
  if (!(assets instanceof Map)) throw new Error('Generated icon assets must be a Map');
  const root = path.resolve(iconsDir);
  const targets = new Map();
  for (const [relative, content] of assets) {
    assertGeneratedPath(relative);
    if (typeof content !== 'string') throw new Error(`Generated asset must be UTF-8 text: ${relative}`);
    targets.set(relative, containedPath(root, relative));
  }
  const stale = [...generatedFiles(root, 'svg', '.svg'), ...generatedFiles(root, 'catalog', '.jsonl')]
    .filter(relative => !assets.has(relative));
  const changed = [...targets].filter(([relative, target]) =>
    !fs.existsSync(target) || fs.readFileSync(target, 'utf8').replace(/\r\n?/g, '\n') !== assets.get(relative));
  if (check) {
    if (changed.length || stale.length) {
      const examples = [...changed.map(([relative]) => relative), ...stale].slice(0, 5).join(', ');
      throw new Error(`Derived icon assets are out of date: ${changed.length} missing or changed, ${stale.length} stale (${examples})`);
    }
    return { files: assets.size, written: 0, removed: 0 };
  }
  for (const [relative, target] of changed) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, assets.get(relative), 'utf8');
  }
  for (const relative of stale) fs.unlinkSync(containedPath(root, relative));
  return { files: assets.size, written: changed.length, removed: stale.length };
}

function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--check') || args.length > 1) throw new Error('Usage: node scripts/build-icon-assets.js [--check]');
  const iconsDir = path.join(__dirname, '..', 'assets', 'icons');
  const manifest = JSON.parse(fs.readFileSync(path.join(iconsDir, 'engu-icons.json'), 'utf8'));
  const sprite = fs.readFileSync(path.join(iconsDir, 'engu-icons-sprite.svg'), 'utf8');
  const result = writeIconAssets(createIconAssets(manifest, sprite), iconsDir, { check: args.includes('--check') });
  console.log(`Icon assets ${args.includes('--check') ? 'verified' : 'built'}: ${manifest.length} icons, ${result.files} files, ${result.written} written, ${result.removed} removed.`);
}

if (require.main === module) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}

module.exports = { createIconAssets, writeIconAssets, iconPath, categoryKey };
