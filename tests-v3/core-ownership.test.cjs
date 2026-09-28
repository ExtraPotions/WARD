'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src');
const source = fs.readdirSync(src)
  .filter(name => name.endsWith('.js'))
  .map(name => fs.readFileSync(path.join(src, name), 'utf8'))
  .join('\n');

test('WARD does not redefine Core-owned shared infrastructure', () => {
  for (const pattern of [
    /function protectLauncherHost\s*\(/u,
    /function layoutGrid\s*\(/u,
    /function registerLauncher\s*\(/u,
    /function createProductNotice\s*\(/u,
    /function createMenuNotice\s*\(/u,
    /function layoutFloatingNotices\s*\(/u,
    /function createDiagnosticsReport\s*\(/u,
    /function createReleaseUpdateChecker\s*\(/u,
  ]) {
    assert.doesNotMatch(source, pattern);
  }
});

test('WARD consumes the public ExtraPotionsCore boundary', () => {
  assert.match(source, /ExtraPotionsCore\./u);
  assert.match(source, /registerLauncher\(/u);
  assert.match(source, /createProductNotice\(/u);
  assert.match(source, /createDiagnosticsReport\(/u);
  assert.match(source, /createReleaseUpdateChecker\(/u);
});
