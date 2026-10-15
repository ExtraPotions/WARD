'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'src', 'ui.js'), 'utf8');

test('WARD delegates update and changelog notice chrome to exp-core', () => {
  assert.match(source, /ExtraPotionsCore\.createProductNotice\(/u);
  assert.match(source, /noticeController\.show\(/u);
  assert.doesNotMatch(source, /updateCard\.innerHTML\s*=/u);
  assert.doesNotMatch(source, /updateTimer\s*=\s*setTimeout/u);
});

test('WARD keeps product-specific retailer UI while Core owns shared launcher chrome', () => {
  assert.match(source, /EXP\.Core\.registerLauncher\(host,\{productId:'ward'\}\)/u);
  assert.match(source, /EXP\.MenuChrome\.create\(/u);
  assert.match(source, /const views/u);
});
