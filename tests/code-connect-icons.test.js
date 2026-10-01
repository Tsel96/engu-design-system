const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');

async function generate(manifest, sprite) {
  const sets = [
    { node_id: 'case', name: 'Icons/AI & Magic/Folder-sparkle' },
    { node_id: 'space', name: 'Icons/Code/test-tube 2' },
    { node_id: 'no-variant', name: 'Icons/Hands/pointer' },
    { node_id: 'moved', name: 'Icons/Custom/moved' },
  ];
  const requests = [];
  const writes = new Map();
  const removed = [];
  const https = { get(url, options, callback) {
    requests.push(url);
    const request = new EventEmitter();
    queueMicrotask(() => {
      const response = new EventEmitter();
      response.statusCode = 200;
      callback(response);
      let data;
      if (url.endsWith('/component_sets')) data = { meta: { component_sets: sets } };
      else if (url.includes('/nodes?')) data = { nodes: Object.fromEntries(sets.map(set => [set.node_id, { document: { type: 'COMPONENT_SET', name: set.name } }])) };
      else throw new Error(`Unexpected request: ${url}`);
      response.emit('data', JSON.stringify(data));
      response.emit('end');
    });
    return request;
  } };
  const fakeFs = {
    readFileSync(file) {
      if (file.endsWith('engu-icons.json')) return JSON.stringify(manifest);
      if (file.endsWith('engu-icons-sprite.svg')) return sprite;
      throw new Error(`Unexpected read: ${file}`);
    },
    mkdirSync() {},
    writeFileSync(file, text) { writes.set(path.basename(file), text); },
    readdirSync() { return ['ai-magic.figma.ts', 'hands.figma.ts', 'notes.txt']; },
    unlinkSync(file) { removed.push(path.basename(file)); },
  };
  const context = {
    require: name => name === 'https' ? https : name === 'fs' ? fakeFs : name === './figma-request' ? require('../scripts/figma-request') : name === './current-icon-sets' ? require('../scripts/current-icon-sets') : name === './build-icon-assets' ? require('../scripts/build-icon-assets') : require(name),
    __dirname: path.resolve(__dirname, '../scripts'),
    process: { env: { FIGMA_TOKEN: 'test-token' }, exit: code => { throw new Error(`Exit ${code}`); } },
    console: { log() {}, warn() {}, error() {} },
    generationComplete: null,
  };
  const source = fs.readFileSync(path.resolve(__dirname, '../scripts/generate-code-connect.js'), 'utf8');
  vm.runInNewContext(source.replace('main().catch', 'generationComplete = main().catch'), context);
  try { await context.generationComplete; }
  catch (error) { throw Object.assign(error, { writes, removed }); }
  return { writes, removed, requests };
}

test('Code Connect maps only live names with exported SVGs, preserving case and spaces', async () => {
  const manifest = [
    { name: 'Folder-sparkle', slug: 'Folder-sparkle', aliases: ['Folder-sparkle'], category: 'AI & Magic' },
    { name: 'test-tube 2', slug: 'test-tube 2', aliases: ['laboratory'], category: 'Code' },
    { name: 'moved', slug: 'moved', aliases: ['moved'], category: 'Old category' },
  ];
  const sprite = '<svg><symbol id="engu-Folder-sparkle"></symbol><symbol id="engu-test-tube 2"></symbol><symbol id="engu-moved"></symbol></svg>';
  const { writes, removed } = await generate(manifest, sprite);
  assert.deepEqual([...writes.keys()], ['ai-magic.figma.ts', 'code.figma.ts']);
  const mappings = [...writes.values()].join('\n');
  assert.match(mappings, /#engu-Folder-sparkle"/);
  assert.match(mappings, /#engu-test-tube 2"/);
  assert.doesNotMatch(mappings, /engu-pointer|engu-moved/);
  assert.equal((mappings.match(/figma\.connect\(/g) || []).length, 2);
  assert.deepEqual(removed, ['hands.figma.ts']);
});

test('Code Connect refuses to overwrite mappings when no exported live SVG matches', async () => {
  await assert.rejects(generate([], '<svg></svg>'), error => {
    assert.match(error.message, /Exit 1/);
    assert.equal(error.writes.size, 0);
    assert.deepEqual(error.removed, []);
    return true;
  });
});

test('Code Connect refuses inconsistent manifest and sprite exports', async () => {
  const manifest = [{ name: 'Folder-sparkle', slug: 'Folder-sparkle', aliases: [], category: 'AI & Magic' }];
  await assert.rejects(generate(manifest, '<svg></svg>'), error => {
    assert.match(error.message, /Exit 1/);
    assert.equal(error.writes.size, 0);
    assert.deepEqual(error.removed, []);
    return true;
  });
});
