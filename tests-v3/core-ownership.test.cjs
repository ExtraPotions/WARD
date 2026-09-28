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
  const pin = fs.readFileSync(path.join(root, 'vendor', 'exp-core', 'PIN'), 'utf8').trim().replace(/^v/, '');
  const parts = pin.split('.').map(Number);
  const services = parts[0] > 3 || (parts[0] === 3 && (parts[1] > 3 || (parts[1] === 3 && parts[2] >= 14)));
  if (services) {
    assert.match(source, /ExtraPotionsCore\.createProductServices\(/u);
    assert.equal(fs.existsSync(path.join(src, 'updates.js')), false);
    assert.equal(fs.existsSync(path.join(src, 'diagnostics.js')), false);
    return;
  }
  assert.match(source, /ExtraPotionsCore\.createLifecycle\(/u);
  assert.match(source, /ExtraPotionsCore\.createProductNotice\(/u);
  assert.match(source, /ExtraPotionsCore\.createDiagnosticsReport\(/u);
  assert.match(source, /ExtraPotionsCore\.createReleaseUpdateChecker\(/u);
});
