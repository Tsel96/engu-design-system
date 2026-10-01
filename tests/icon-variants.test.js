const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

// Evaluate only the pure selectors; no main(), Figma request or file write runs.
const source = fs.readFileSync(path.resolve(__dirname, '../scripts/export-figma-icons.js'), 'utf8');
const selectors = {
  require: name => name.startsWith('./') ? require(path.resolve(__dirname, '../scripts', name)) : require(name),
  __dirname: path.resolve(__dirname, '../scripts'),
  process: { env: { FIGMA_TOKEN: 'fixture-token' } },
};
vm.runInNewContext(source.slice(0, source.indexOf('function escapeHtml')), selectors);
const component = (id, name, extra = {}) => ({ id, name, type: 'COMPONENT', ...extra });

test('default selection keeps native Outlined 24 ahead of single-style or Solid variants regardless of child order', () => {
  const solid = component('solid-24', 'Size=24, Style=Solid');
  const single = component('single-24', 'Size=24');
  const outlined = component('outlined-24', '  Style = OUTLINED , Size = 24 ');
  const children = [solid, component('outlined-48', 'Style=Outlined, Size=48'), single, outlined];
  assert.equal(selectors.pickDefault24(children), outlined);
  assert.deepEqual(children.map(child => child.id), ['solid-24', 'outlined-48', 'single-24', 'outlined-24']);
});

test('single-style 24 wins before Solid while a native Solid 24 fills an Outlined-only-at-48 gap', () => {
  const solid = component('solid-24', 'Style=Solid, Size=24');
  const single = component('single-24', 'Size=24');
  const outlined48 = component('outlined-48', 'Size=48, Style=Outlined');
  assert.equal(selectors.pickDefault24([solid, single, outlined48]), single);
  assert.equal(selectors.pickDefault24([outlined48, solid]), solid);
  assert.equal(selectors.pickOutlined24([outlined48, solid]), null, 'legacy outlined selector keeps its previous meaning');
});

test('default selection ignores hidden and non-component variants and never substitutes other sizes or styles', () => {
  const solid = component('visible-solid', 'Size=24, Style=Solid');
  const ignored = [
    component('hidden-outline', 'Size=24, Style=Outlined', { visible: false }),
    component('hidden-single', 'Size=24', { visible: false }),
    component('frame-outline', 'Size=24, Style=Outlined', { type: 'FRAME' }),
    component('group-outline', 'Size=24, Style=Outlined', { type: 'GROUP' }),
    component('outlined-48', 'Size=48, Style=Outlined'),
    component('solid-16', 'Size=16, Style=Solid'),
    component('duotone-24', 'Size=24, Style=Duotone'),
  ];
  assert.equal(selectors.pickDefault24([...ignored, solid]), solid);
  assert.equal(selectors.pickDefault24(ignored), null);
  assert.equal(selectors.pickDefault24([]), null);
});
