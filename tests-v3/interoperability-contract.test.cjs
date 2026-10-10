'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

test('WARD delegates suite and presentation metadata to Core diagnostics bootstrap', () => {
  const source = read('src/main.js');
  assert.match(source, /registerDiagnosticsProduct\('ward'/);
  assert.doesNotMatch(source, /registerSuiteProduct\?\./u);
  assert.doesNotMatch(source, /registerPresentationProvider\?\./u);
});

test('generated WARD userscript keeps the same Core-owned interoperability bootstrap', () => {
  const built = read('ward.user.js');
  assert.match(built, /registerDiagnosticsProduct\(['"]ward['"]/);
  assert.doesNotMatch(built, /registerSuiteProduct\?\./u);
  assert.doesNotMatch(built, /registerPresentationProvider\?\./u);
});

test('WARD publishes and clears shared presentation state through Core', () => {
  const actions = read('src/actions.js');
  assert.ok(actions.includes("ExtraPotionsCore.setPresentationState(record.node, 'ward'"));
  assert.ok(actions.includes("ExtraPotionsCore.clearPresentationState(node, 'ward')"));
});

test('WARD reaches Core through the bundle-local binding, never an unassigned global', () => {
  for (const file of fs.readdirSync(path.join(root, 'src')).filter((name) => name.endsWith('.js'))) {
    assert.doesNotMatch(read(`src/${file}`), /globalThis\.ExtraPotionsCore/u, file);
  }
});


test('WARD publishes aggregate non-identifying suite state', () => {
  const engine = read('src/engine.js');
  assert.match(engine, /ExtraPotionsCore\.publishSuiteState\('ward', 'ward\.state-changed'/u);
  for (const field of ['interventions', 'hide', 'dim', 'collapse', 'annotate']) assert.match(engine, new RegExp(field));
  const block = engine.slice(engine.indexOf("publishSuiteState('ward'"), engine.indexOf('});', engine.indexOf("publishSuiteState('ward'")) + 3);
  assert.doesNotMatch(block, /price|title|text|product|account|url/i);
});
