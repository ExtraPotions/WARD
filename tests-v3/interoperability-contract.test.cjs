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
  assert.match(built, /registerDiagnosticsProduct\('ward'/);
  assert.doesNotMatch(built, /registerSuiteProduct\?\./u);
  assert.doesNotMatch(built, /registerPresentationProvider\?\./u);
});

test('WARD publishes and clears shared presentation state through Core', () => {
  const actions = read('src/actions.js');
  assert.ok(actions.includes("globalThis.ExtraPotionsCore?.setPresentationState?.(record.node, 'ward'"));
  assert.ok(actions.includes("globalThis.ExtraPotionsCore?.clearPresentationState?.(node, 'ward')"));
});
