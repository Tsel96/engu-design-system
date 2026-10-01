const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { createIconAssets, writeIconAssets, iconPath } = require('../scripts/build-icon-assets');
const { searchIcons, describeIcon, resolveIcon } = require('../scripts/icons');

const repository = path.resolve(__dirname, '..');
const iconsDir = path.join(repository, 'assets', 'icons');
const cli = path.join(repository, 'scripts', 'icons.js');
const manifest = JSON.parse(fs.readFileSync(path.join(iconsDir, 'engu-icons.json'), 'utf8'));
const sprite = fs.readFileSync(path.join(iconsDir, 'engu-icons-sprite.svg'), 'utf8');

function temporaryDirectory(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'engu-icon-agent-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  return directory;
}

function invoke(args, cwd = repository) {
  return spawnSync(process.execPath, [cli, ...args], { cwd, encoding: 'utf8' });
}

function jsonOutput(result) {
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(result.stderr, '');
  return JSON.parse(result.stdout);
}

const fixture = [
  { name: 'Folder-sparkle', slug: 'Folder-sparkle', aliases: ['Folder-sparkle', 'magic folder'], category: 'Custom' },
  { name: 'test-tube 2', slug: 'test-tube 2', aliases: ['test-tube 2', 'laboratory'], category: 'Code' },
];
const fixtureGeometry = [
  '<defs><clipPath id="clip-0"><path d="M0 0h24v24H0z"/></clipPath></defs><g clip-path="url(#clip-0)"><path d="M3 4h8v7H3z" fill="#1A1815"/></g>',
  '<path d="M5 1v16a3 3 0 0 0 6 0V1" stroke="#1A1815"/>',
];
const fixtureSprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">${fixture.map((icon, i) =>
  `<symbol id="engu-${icon.slug}" viewBox="0 0 24 24" fill="none">${fixtureGeometry[i]}</symbol>`).join('')}</svg>`;

test('generated catalogs preserve every source name, slug, category and alias without SVG geometry', () => {
  const assets = createIconAssets(manifest, sprite);
  const index = JSON.parse(assets.get('index.json'));
  assert.equal(index.version, 1);
  assert.equal(index.count, manifest.length);
  assert.equal(index.sprite, 'engu-icons-sprite.svg');
  assert.equal(index.categories.length, new Set(manifest.map(icon => icon.category)).size);
  assert.ok(assets.get('index.json').length < 16000, 'entry point should remain a small category directory');
  const catalog = new Map();
  for (const category of index.categories) {
    const records = assets.get(category.catalog).trim().split('\n').map(line => JSON.parse(line));
    assert.equal(records.length, category.count);
    for (const record of records) {
      assert.equal(record.category, category.name);
      assert.deepEqual(Object.keys(record).sort(), ['aliases', 'category', 'name', 'slug']);
      catalog.set(record.slug, record);
    }
  }
  assert.equal(catalog.size, manifest.length);
  for (const icon of manifest) {
    assert.deepEqual(catalog.get(icon.slug), icon, `metadata changed for ${icon.name}`);
    const svg = assets.get(iconPath(icon));
    assert.ok(svg, `missing standalone SVG for ${icon.name}`);
    const symbol = sprite.match(new RegExp(`<symbol\\b[^>]*id="engu-${icon.slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>([\\s\\S]*?)<\\/symbol>`));
    assert.ok(symbol, `missing source symbol for ${icon.name}`);
    assert.ok(svg.includes(symbol[1].replace(/\r\n/g, '\n')), `geometry changed for ${icon.name}`);
  }
});

test('standalone SVG preserves exact case, spaces, symbol attributes and internal definition references', () => {
  const assets = createIconAssets(fixture, fixtureSprite);
  fixture.forEach((icon, i) => {
    assert.equal(iconPath(icon), `svg/${icon.category.toLowerCase()}/${icon.slug}.svg`);
    const svg = assets.get(iconPath(icon));
    assert.match(svg, /^<svg\b/);
    assert.ok(svg.includes(`id="engu-${icon.slug}"`));
    assert.match(svg, /viewBox="0 0 24 24"/);
    assert.match(svg, /fill="none"/);
    assert.ok(svg.includes(fixtureGeometry[i]));
    assert.doesNotMatch(svg, /<symbol\b|display:none|aria-hidden="true"/);
  });
  assert.match(assets.get(iconPath(fixture[0])), /clip-path="url\(#clip-0\)"/);
});

test('generation rejects path traversal, collisions and mismatched sprites before producing assets', () => {
  for (const slug of ['../escape', '..\\escape', 'folder/icon', 'folder\\icon', '/absolute', 'C:\\absolute']) {
    assert.throws(() => createIconAssets([{ ...fixture[0], slug }], fixtureSprite), undefined, `unsafe slug ${slug}`);
  }
  assert.throws(() => createIconAssets([fixture[0], { ...fixture[0], category: 'Code' }], fixtureSprite));
  assert.throws(() => createIconAssets([fixture[0], { ...fixture[1], category: 'custom' }], fixtureSprite));
  assert.throws(() => createIconAssets(fixture, fixtureSprite.replace('engu-test-tube 2', 'engu-unexpected')));
  assert.throws(() => createIconAssets(fixture, fixtureSprite.replace('</svg>', '<symbol id="engu-unexpected" viewBox="0 0 24 24"></symbol></svg>')));
});

test('check mode reports missing, modified and stale generated assets without changing disk', t => {
  const directory = temporaryDirectory(t);
  const assets = createIconAssets(fixture, fixtureSprite);
  assert.throws(() => writeIconAssets(assets, directory, { check: true }));
  assert.deepEqual(fs.readdirSync(directory), []);
  writeIconAssets(assets, directory);
  assert.doesNotThrow(() => writeIconAssets(assets, directory, { check: true }));
  const target = path.join(directory, iconPath(fixture[0]));
  fs.writeFileSync(target, 'changed');
  assert.throws(() => writeIconAssets(assets, directory, { check: true }));
  assert.equal(fs.readFileSync(target, 'utf8'), 'changed');
  writeIconAssets(assets, directory);
  const stale = path.join(directory, 'svg', 'custom', 'stale.svg');
  fs.writeFileSync(stale, 'stale');
  assert.throws(() => writeIconAssets(assets, directory, { check: true }));
  assert.equal(fs.readFileSync(stale, 'utf8'), 'stale');
});

test('check mode accepts CRLF checkouts without rewriting generated geometry or metadata', t => {
  const directory = temporaryDirectory(t);
  const assets = createIconAssets(fixture, fixtureSprite);
  writeIconAssets(assets, directory);
  for (const [relative, content] of assets) fs.writeFileSync(path.join(directory, relative), content.replace(/\n/g, '\r\n'));
  assert.doesNotThrow(() => writeIconAssets(assets, directory, { check: true }));
  for (const [relative, content] of assets) {
    assert.equal(fs.readFileSync(path.join(directory, relative), 'utf8'), content.replace(/\n/g, '\r\n'));
  }
});

test('rebuilding removes stale generated files while preserving source and unrelated files', t => {
  const directory = temporaryDirectory(t);
  const assets = createIconAssets(fixture, fixtureSprite);
  writeIconAssets(assets, directory);
  const staleSvg = path.join(directory, 'svg', 'custom', 'stale.svg');
  const staleCatalog = path.join(directory, 'catalog', 'stale.jsonl');
  const preserved = [path.join(directory, 'engu-icons.json'), path.join(directory, 'svg', 'notes.txt'), path.join(directory, 'catalog', 'README.md')];
  for (const file of [staleSvg, staleCatalog, ...preserved]) fs.writeFileSync(file, 'keep-or-remove');
  writeIconAssets(assets, directory);
  assert.equal(fs.existsSync(staleSvg), false);
  assert.equal(fs.existsSync(staleCatalog), false);
  for (const file of preserved) assert.equal(fs.readFileSync(file, 'utf8'), 'keep-or-remove');
  assert.doesNotThrow(() => writeIconAssets(assets, directory, { check: true }));
});

test('generated paths cannot write through a linked directory or escape the icon root', t => {
  const directory = temporaryDirectory(t);
  const outside = temporaryDirectory(t);
  fs.mkdirSync(path.join(directory, 'svg'));
  try {
    fs.symlinkSync(outside, path.join(directory, 'svg', 'custom'), process.platform === 'win32' ? 'junction' : 'dir');
  } catch (error) {
    if (error.code === 'EPERM' || error.code === 'EACCES') return t.skip('directory links unavailable');
    throw error;
  }
  const sentinel = path.join(outside, 'sentinel.svg');
  fs.writeFileSync(sentinel, 'outside');
  assert.throws(() => writeIconAssets(createIconAssets(fixture, fixtureSprite), directory));
  assert.deepEqual(fs.readdirSync(outside), ['sentinel.svg']);
  assert.equal(fs.readFileSync(sentinel, 'utf8'), 'outside');
  assert.throws(() => writeIconAssets(new Map([['../escape.txt', 'unsafe']]), directory));
});

const searchFixture = [
  { name: 'next-navigation', slug: 'next-navigation', aliases: ['next step'], category: 'Custom' },
  { name: 'arrow-right', slug: 'arrow-right', aliases: ['next'], category: 'Arrows' },
  { name: 'next', slug: 'next', aliases: ['forward'], category: 'Arrows' },
  { name: 'diagram', slug: 'diagram', aliases: ['arrow', 'right'], category: 'Code' },
];

test('search ranks canonical names before aliases, requires every query term, and paginates metadata', () => {
  const result = searchIcons(searchFixture, 'NEXT', { limit: 2 });
  assert.equal(result.total, 3);
  assert.equal(result.offset, 0);
  assert.equal(result.limit, 2);
  assert.equal(result.nextOffset, 2);
  assert.deepEqual(result.results.map(icon => icon.name), ['next', 'arrow-right']);
  const page = searchIcons(searchFixture, 'next', { limit: 2, offset: result.nextOffset });
  assert.deepEqual(page.results.map(icon => icon.name), ['next-navigation']);
  assert.equal(page.nextOffset, null);
  assert.deepEqual(new Set(searchIcons(searchFixture, 'ARROW RIGHT').results.map(icon => icon.name)), new Set(['arrow-right', 'diagram']));
  assert.equal(searchIcons(searchFixture, 'arrow missing').total, 0);
  assert.equal(searchIcons(searchFixture, '', { category: 'Arrows' }).total, 2);
  assert.equal(searchIcons(searchFixture, 'next', { category: 'Arrows' }).total, 2);
  assert.doesNotMatch(JSON.stringify(result), /<svg|<path|viewBox|\"d\":/);
});

test('exact lookup preserves canonical names and slugs while aliases remain search terms', () => {
  assert.deepEqual(resolveIcon(fixture, 'Folder-sparkle'), fixture[0]);
  assert.deepEqual(resolveIcon(fixture, 'test-tube 2'), fixture[1]);
  assert.throws(() => resolveIcon(fixture, 'folder-sparkle'));
  assert.throws(() => resolveIcon(fixture, 'laboratory'));
  const description = describeIcon(fixture[1]);
  assert.deepEqual(description, {
    ...fixture[1], symbolId: 'engu-test-tube 2', svg: 'assets/icons/svg/code/test-tube 2.svg',
    sprite: 'assets/icons/engu-icons-sprite.svg#engu-test-tube%202',
  });
});

test('CLI has a compact default, bounded category/search output and works outside the repository', t => {
  const directory = temporaryDirectory(t);
  const help = invoke([], directory);
  assert.equal(help.status, 0, help.stderr);
  assert.ok(help.stdout.length < 4000);
  assert.doesNotMatch(help.stdout, /<svg|<path/);
  const categories = jsonOutput(invoke(['categories'], directory));
  assert.equal(categories.count, manifest.length);
  assert.equal(categories.categories.length, new Set(manifest.map(icon => icon.category)).size);
  assert.doesNotMatch(JSON.stringify(categories), /aliases|<path/);
  const result = jsonOutput(invoke(['search', 'arrow', '--limit', '2'], directory));
  assert.equal(result.limit, 2);
  assert.equal(result.results.length, 2);
  assert.ok(result.total > result.results.length);
  assert.equal(result.nextOffset, 2);
  assert.ok(JSON.stringify(result).length < 4000);
  const next = jsonOutput(invoke(['search', 'arrow', '--limit', '2', '--offset', '2'], directory));
  assert.equal(next.offset, 2);
  assert.equal(new Set([...result.results, ...next.results].map(icon => icon.slug)).size, 4);
  const scoped = jsonOutput(invoke(['search', '--category', 'Code', '--limit', '3'], directory));
  assert.ok(scoped.results.length > 0);
  assert.ok(scoped.results.every(icon => icon.category === 'Code'));
});

test('CLI get and svg expose only the selected icon, preserving names with case and spaces', t => {
  const directory = temporaryDirectory(t);
  for (const name of ['Folder-sparkle', 'test-tube 2']) {
    const source = manifest.find(icon => icon.name === name);
    assert.ok(source, `missing regression icon ${name}`);
    const metadata = jsonOutput(invoke(['get', name], directory));
    assert.deepEqual(metadata, describeIcon(source));
    const result = invoke(['svg', name], directory);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /^<svg\b/);
    assert.ok(result.stdout.includes(`id="engu-${source.slug}"`));
    assert.equal((result.stdout.match(/<svg\b/g) || []).length, 1);
    assert.doesNotMatch(result.stdout, /<symbol\b/);
    const output = path.join(directory, `${source.slug}.svg`);
    const saved = invoke(['svg', name, '--output', output], directory);
    assert.equal(saved.status, 0, saved.stderr);
    assert.equal(fs.readFileSync(output, 'utf8'), result.stdout);
    assert.doesNotMatch(saved.stdout, /<svg|<path/);
    const repeat = invoke(['svg', name, '--output', output], directory);
    assert.notEqual(repeat.status, 0, 'existing output should require an explicit new path');
    assert.equal(fs.readFileSync(output, 'utf8'), result.stdout);
  }
});

test('CLI rejects unbounded search, invalid pagination and unknown exact names with concise errors', () => {
  for (const args of [
    ['search'], ['search', ''], ['search', 'arrow', '--limit', '0'], ['search', 'arrow', '--limit', '51'],
    ['search', 'arrow', '--limit', '1.5'], ['search', 'arrow', '--offset', '-1'], ['search', 'arrow', '--offset', 'abc'],
    ['search', 'arrow', '--category', 'Missing category'], ['search', 'arrow', '--unknown'],
    ['get', 'folder-sparkle'], ['get', 'not-an-engu-icon'], ['svg', 'not-an-engu-icon'],
  ]) {
    const result = invoke(args);
    assert.notEqual(result.status, 0, `unexpected success: ${args.join(' ')}`);
    assert.ok((result.stderr + result.stdout).length < 2000, `oversized error: ${args.join(' ')}`);
    assert.doesNotMatch(result.stderr + result.stdout, /<svg|<path|\"aliases\":/);
  }
});
