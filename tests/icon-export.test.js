const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');

test('icon export preserves existing defaults and aliases while recording native Solid fallbacks', async () => {
  const published = ['duplicate', 'renamed', 'custom', 'deleted', 'hidden', 'solid-only', 'single-style', 'wrong-type']
    .map(node_id => ({ node_id, name: `Icons/Old/${node_id}` }));
  const document = (name, id, extra = {}) => ({ document: {
    type: 'COMPONENT_SET', name, children: [{ id, name: 'Style=Outlined, Size=24' }], ...extra,
  } });
  const nodes = {
    renamed: document('Icons/Code/commits', 'icon-1'),
    custom: document('Icons/Custom/deployment', 'icon-2'),
    deleted: null,
    hidden: document('Icons/Old/hidden', 'icon-hidden', { visible: false }),
    duplicate: document('Icons/Code/commits', 'icon-duplicate', {
      children: [{ id: 'icon-duplicate', type: 'COMPONENT', name: 'Style=Solid, Size=24' }],
    }),
    'solid-only': document('Icons/Hands/pointer', 'solid-24', {
      children: [
        { id: 'outlined-48', type: 'COMPONENT', name: 'Size=48, Style=Outlined' },
        { id: 'hidden-outlined-24', type: 'COMPONENT', name: 'Size=24, Style=Outlined', visible: false },
        { id: 'frame-outlined-24', type: 'FRAME', name: 'Size=24, Style=Outlined' },
        { id: 'solid-24', type: 'COMPONENT', name: 'Style=Solid, Size=24' },
      ],
    }),
    'single-style': document('Icons/Social Media & Brands/brand-mark', 'native-24', {
      children: [{ id: 'native-24', type: 'COMPONENT', name: 'Size=24' }],
    }),
    'wrong-type': document('Icons/Old/wrong-type', 'icon-frame', { type: 'FRAME' }),
  };
  const writes = new Map();
  const requests = [];
  const https = { get(url, options, callback) {
    if (typeof options === 'function') callback = options;
    requests.push(url);
    const request = new EventEmitter();
    queueMicrotask(() => {
      const response = new EventEmitter();
      response.statusCode = 200;
      callback(response);
      let data;
      if (url.endsWith('/component_sets')) data = { meta: { component_sets: published } };
      else if (url.includes('/nodes?')) data = { nodes };
      else if (url.includes('/images/')) data = { images: {
        'icon-1': 'https://svg.test/1', 'icon-2': 'https://svg.test/2',
        'solid-24': 'https://svg.test/solid', 'native-24': 'https://svg.test/native',
      } };
      else if (url === 'https://svg.test/solid') data = '<svg viewBox="0 0 24 24"><path d="M3 7h5v4H3z" fill="#AB12CD"/></svg>';
      else if (url.startsWith('https://svg.test/')) data = '<svg viewBox="0 0 24 24"><path d="M1 1h2v2H1z"/></svg>';
      else throw new Error(`Unexpected request: ${url}`);
      response.emit('data', typeof data === 'string' ? data : JSON.stringify(data));
      response.emit('end');
    });
    return request;
  } };
  const prior = [
    { name: 'commits', slug: 'commits', aliases: ['history', 'commit'], category: 'Code' },
    { name: 'deployment', slug: 'deployment', aliases: ['deployment', 'ship'], category: 'Custom' },
  ];
  const fakeFs = {
    readFileSync(file) { return file.endsWith('.json') ? JSON.stringify(prior) : '<html><main></main></html>'; },
    writeFileSync(file, data) { writes.set(path.basename(file), data); },
  };
  const iconBuilder = require('../scripts/build-icon-assets');
  const context = {
    require: name => name === 'https' ? https : name === 'fs' ? fakeFs : name === './figma-request' ? require('../scripts/figma-request') : name === './build-icon-assets' ? {
      createIconAssets: iconBuilder.createIconAssets,
      writeIconAssets: assets => { for (const [file, data] of assets) fakeFs.writeFileSync(file, data); },
    } : require(name),
    __dirname: path.resolve(__dirname, '../scripts'),
    process: { env: { FIGMA_TOKEN: 'test-token' }, exit: code => { throw new Error(`Exit ${code}`); } },
    console: { log() {}, warn() {}, error() {} },
    exportComplete: null,
  };
  const source = fs.readFileSync(path.resolve(__dirname, '../scripts/export-figma-icons.js'), 'utf8');
  vm.runInNewContext(source.replace('main().catch', 'exportComplete = main().catch'), context);
  await context.exportComplete;
  const manifest = JSON.parse(writes.get('engu-icons.json'));
  assert.deepEqual(manifest.map(({ category, name }) => ({ category, name })), [
    { category: 'Code', name: 'commits' }, { category: 'Custom', name: 'deployment' },
    { category: 'Hands', name: 'pointer' }, { category: 'Social Media & Brands', name: 'brand-mark' },
  ]);
  assert.deepEqual(manifest.slice(0, 2), prior);
  assert.deepEqual(manifest.find(icon => icon.name === 'pointer').variant, { size: 24, style: 'Solid', nodeId: 'solid-24' });
  assert.equal('variant' in manifest.find(icon => icon.name === 'brand-mark'), false);
  const sprite = writes.get('engu-icons-sprite.svg');
  assert.match(sprite, /id="engu-commits"/);
  assert.match(sprite, /id="engu-deployment"/);
  assert.match(sprite, /<symbol id="engu-pointer"[^>]*><path d="M3 7h5v4H3z" fill="#AB12CD"\/><\/symbol>/);
  assert.doesNotMatch(sprite, /engu-renamed|engu-custom|engu-hidden|engu-duplicate/);
  assert.match(writes.get('engu-icons-browse.html'), /data-cat="Custom"/);
  assert.equal(JSON.parse(writes.get('index.json')).count, 4);
  assert.match(writes.get('commits.svg'), /id="engu-commits"/);
  assert.match(writes.get('deployment.svg'), /id="engu-deployment"/);
  const exportRequest = requests.find(url => url.includes('/images/'));
  assert.match(exportRequest, /ids=icon-1,icon-2,solid-24,native-24&/);
  assert.doesNotMatch(exportRequest, /icon-duplicate|outlined-48|hidden-outlined-24|frame-outlined-24/);
});
