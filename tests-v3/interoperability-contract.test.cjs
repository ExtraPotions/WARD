'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

test('WARD declares its suite interoperability capabilities', () => {
  const source = read('src/main.js');
  assert.ok(source.includes('registerSuiteProduct?.({'));
  assert.ok(source.includes('retail.classification'));
  assert.ok(source.includes('retail.cleanup'));
  assert.ok(source.includes('retail.coupons'));
});

test('generated WARD userscript carries the same suite declaration', () => {
  const built = read('ward.user.js');
  assert.ok(built.includes("productId: 'ward'"));
  assert.ok(built.includes('retail.classification'));
});

test('WARD declares its presentation interoperability phase', () => {
  const source = read('src/main.js');
  assert.ok(source.includes('registerPresentationProvider?.({'));
  assert.ok(source.includes("productId: 'ward'"));
  assert.ok(source.includes("'classify'"));
  assert.ok(source.includes("'visibility'"));
});

test('WARD uses the shared presentation contract at its existing engine gate', () => {
  const actions = read('src/actions.js');
  assert.ok(actions.includes("setPresentationState?.(record.node, 'ward'"));
  assert.ok(actions.includes("clearPresentationState?.(node, 'ward')"));
  assert.ok(actions.includes("record.action === 'collapse'"));
});
