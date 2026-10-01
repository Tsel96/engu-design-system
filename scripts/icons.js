#!/usr/bin/env node
// Agent-facing lookup. Read the catalog internally; print only requested results.
const fs = require('node:fs');
const path = require('node:path');
const { categoryKey, iconPath } = require('./build-icon-assets');

const ICONS_DIR = path.join(__dirname, '..', 'assets', 'icons');
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const HELP = `Engu icons — bounded lookup; original names and aliases are preserved.
node scripts/icons.js search "QUERY" [--category "CATEGORY"] [--limit 10] [--offset 0]
node scripts/icons.js search --category "CATEGORY" [--limit 10] [--offset 0]
node scripts/icons.js get "EXACT NAME"
node scripts/icons.js svg "EXACT NAME" [--output FILE]
node scripts/icons.js categories
Search uses names and existing aliases. Default: 10 results; maximum: 50.
get returns metadata. svg retrieves one icon, including its original defs/colors.
Read assets/icons/README.md for remote access and offline regeneration.\n`;

function describeIcon(icon) {
  const symbolId = `engu-${icon.slug}`;
  return {
    name: icon.name,
    slug: icon.slug,
    category: icon.category,
    aliases: icon.aliases,
    symbolId,
    svg: `assets/icons/${iconPath(icon)}`,
    sprite: `assets/icons/engu-icons-sprite.svg#${encodeURIComponent(symbolId)}`,
  };
}

function resolveIcon(manifest, name) {
  const matches = manifest.filter(icon => icon.name === name || icon.slug === name);
  if (matches.length !== 1) {
    throw new Error(matches.length ? `Ambiguous icon name: ${name}` : `Unknown icon: ${name}. Use search to find its exact name.`);
  }
  return matches[0];
}

function integer(value, name, min, max = Number.MAX_SAFE_INTEGER) {
  const number = Number(value);
  if (value === '' || !Number.isSafeInteger(number) || number < min || number > max) {
    throw new Error(`${name} must be an integer from ${min} to ${max}.`);
  }
  return number;
}

function searchIcons(manifest, query, { category, limit = DEFAULT_LIMIT, offset = 0 } = {}) {
  limit = integer(limit, 'limit', 1, MAX_LIMIT);
  offset = integer(offset, 'offset', 0);
  const needle = String(query ?? '').trim().toLowerCase();
  if (!needle && !category) throw new Error('Provide a search query or --category.');

  let candidates = manifest;
  if (category) {
    const categories = [...new Set(manifest.map(icon => icon.category))];
    const requested = String(category).toLowerCase();
    const resolved = categories.find(name => name.toLowerCase() === requested || categoryKey(name) === requested);
    if (!resolved) throw new Error(`Unknown category: ${category}. Use categories to list available categories.`);
    candidates = candidates.filter(icon => icon.category === resolved);
  }

  const terms = needle.split(/[\s-]+/).filter(Boolean);
  const ranked = candidates.map((icon, position) => {
    const name = icon.name.toLowerCase();
    const slug = icon.slug.toLowerCase();
    const aliases = icon.aliases.map(alias => alias.toLowerCase());
    const fields = [name, slug, ...aliases];
    if (needle && !terms.every(term => fields.some(field => field.includes(term)))) return null;
    let rank = 0;
    if (needle) {
      rank = name === needle || slug === needle ? 4
        : aliases.includes(needle) ? 3
        : fields.some(field => field.startsWith(needle)) ? 2
        : fields.some(field => field.includes(needle)) ? 1 : 0;
    }
    return { icon, rank, position };
  }).filter(Boolean).sort((a, b) => b.rank - a.rank || a.position - b.position);

  const results = ranked.slice(offset, offset + limit).map(({ icon }) => describeIcon(icon));
  return {
    total: ranked.length,
    offset,
    limit,
    results,
    nextOffset: offset + results.length < ranked.length ? offset + results.length : null,
  };
}

function parseArgs(args, allowed) {
  const positionals = [];
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--') {
      positionals.push(...args.slice(i + 1));
      break;
    }
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      if (!allowed.includes(key)) throw new Error(`Unknown option: ${arg}`);
      if (key in options) throw new Error(`Repeated option: ${arg}`);
      if (args[i + 1] === undefined || args[i + 1].startsWith('--')) throw new Error(`Missing value for ${arg}`);
      options[key] = args[++i];
    } else positionals.push(arg);
  }
  return { positionals, options };
}

function runCli(args, { iconsDir = ICONS_DIR } = {}) {
  const [command, ...rest] = args;
  if (!command || command === '--help' || command === '-h' || command === 'help') {
    process.stdout.write(HELP);
    return;
  }
  if (!['search', 'get', 'svg', 'categories'].includes(command)) throw new Error(`Unknown command: ${command}. Use --help.`);
  const allowed = command === 'search' ? ['category', 'limit', 'offset'] : command === 'svg' ? ['output'] : [];
  const { positionals, options } = parseArgs(rest, allowed);
  if (command === 'categories') {
    if (positionals.length) throw new Error('categories takes no arguments.');
    const index = JSON.parse(fs.readFileSync(path.join(iconsDir, 'index.json'), 'utf8'));
    process.stdout.write(JSON.stringify({ count: index.count, categories: index.categories.map(({ name, count }) => ({ name, count })) }) + '\n');
    return;
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(iconsDir, 'engu-icons.json'), 'utf8'));
  if (command === 'search') {
    process.stdout.write(JSON.stringify(searchIcons(manifest, positionals.join(' '), options)) + '\n');
    return;
  }
  if (positionals.length !== 1 || !positionals[0]) throw new Error(`${command} requires one quoted exact icon name.`);
  const icon = resolveIcon(manifest, positionals[0]);
  if (command === 'get') {
    process.stdout.write(JSON.stringify(describeIcon(icon)) + '\n');
    return;
  }
  const source = path.join(iconsDir, iconPath(icon));
  const svg = fs.readFileSync(source, 'utf8');
  if (options.output) {
    const output = path.resolve(options.output);
    fs.writeFileSync(output, svg, { flag: 'wx' });
    process.stdout.write(JSON.stringify({ name: icon.name, output, bytes: Buffer.byteLength(svg) }) + '\n');
  } else process.stdout.write(svg);
}

if (require.main === module) {
  try { runCli(process.argv.slice(2)); }
  catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { describeIcon, resolveIcon, searchIcons, runCli };
