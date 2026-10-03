'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');

test('WARD uses the shared version-scoped updater and concise release parsing', () => {
  const services = fs.existsSync(path.join(root, 'src', 'updates.js'))
    ? read('src/updates.js')
    : read('src/core.js');
  const core = read('vendor/exp-core/exp-core.js');

  assert.match(services, /ExtraPotionsCore\.(?:createReleaseUpdateChecker|createProductServices)/);
  assert.match(services, /productId:\s*'ward'/);
  assert.match(services, /repository:\s*'ExtraPotions\/WARD'/);
  assert.match(services, /currentVersion:\s*(?:\(\)\s*=>\s*)?EXP\.VERSION/);

  assert.match(core, /function releaseDetails\(body\)/);
  assert.match(core, /checkedForCurrentVersion = state\.checkedForVersion === currentVersion/);
  assert.match(core, /state\.lastCheckAt = 0/);
  assert.match(core, /state\.lastRemoteVersion = ''/);
  assert.match(core, /state\.checkedForVersion = currentVersion/);
});
