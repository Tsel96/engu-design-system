const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');

test('icon export uses current names, retains Custom icons and omits stale library entries', async () => {
  const published = ['renamed', 'custom', 'deleted', 'hidden', 'duplicate', 'wrong-type']
    .map(node_id => ({ node_id, name: `Icons/Old/${node_id}` }));
  const document = (name, id, extra = {}) => ({ document: {
    type: 'COMPONENT_SET', name, children: [{ id, name: 'Style=Outlined, Size=24' }], ...extra,
  } });
  const nodes = {
    renamed: document('Icons/Code/commits', 'icon-1'),
    custom: document('Icons/Custom/deployment', 'icon-2'),
    deleted: null,
    hidden: document('Icons/Old/hidden', 'icon-hidden', { visible: false }),
    duplicate: document('Icons/Code/commits', 'icon-duplicate'),
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
      else if (url.includes('/images/')) data = { images: { 'icon-1': 'https://svg.test/1', 'icon-2': 'https://svg.test/2' } };
      else if (url.startsWith('https://svg.test/')) data = '<svg viewBox="0 0 24 24"><path d="M1 1h2v2H1z"/></svg>';
      else throw new Error(`Unexpected request: ${url}`);
      response.emit('data', typeof data === 'string' ? data : JSON.stringify(data));
      response.emit('end');
    });
    return request;
  } };
  const fakeFs = {
    readFileSync(file) { return file.endsWith('.json') ? '[]' : '<html><main></main></html>'; },
    writeFileSync(file, data) { writes.set(path.basename(file), data); },
  };
  const context = {
    require: name => name === 'https' ? https : name === 'fs' ? fakeFs : require(name),
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
  ]);
  const sprite = writes.get('engu-icons-sprite.svg');
  assert.match(sprite, /id="engu-commits"/);
  assert.match(sprite, /id="engu-deployment"/);
  assert.doesNotMatch(sprite, /engu-renamed|engu-custom|engu-hidden|engu-duplicate/);
  assert.match(writes.get('engu-icons-browse.html'), /data-cat="Custom"/);
  assert.match(requests.find(url => url.includes('/images/')), /ids=icon-1,icon-2&/);
});
