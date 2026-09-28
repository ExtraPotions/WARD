'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');

test('WARD declares its suite interoperability capabilities', () => {
  const source = read('src/main.js');
  assert.match(source, /registerSuiteProduct\?\./u);
  for (const capability of ['retail.classification', 'retail.cleanup', 'retail.coupons']) {
    assert.match(source, new RegExp(capability.replace('.', '\\.')));
  }
});

test('generated WARD userscript carries the same suite declaration', () => {
  const built = read('ward.user.js');
  assert.match(built, /productId:\s*'ward'/u);
  assert.match(built, /retail\.cleanup/u);
});
