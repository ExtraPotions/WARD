'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const node = process.execPath;
const run = (args) => execFileSync(node, args, { cwd: root, stdio: 'inherit' });

run([path.join(root, 'scripts', 'build.cjs')]);
run([path.join(root, 'scripts', 'build.cjs'), '--check']);

for (const directory of ['src', 'scripts', 'tests-v3']) {
  for (const entry of fs.readdirSync(path.join(root, directory), { withFileTypes: true })) {
    if (!entry.isFile() || !/\.(?:js|cjs)$/.test(entry.name)) continue;
    run(['--check', path.join(root, directory, entry.name)]);
  }
}

run([
  '--test',
  path.join(root, 'tests-v3', 'contracts.test.cjs'),
  path.join(root, 'tests-v3', 'fallback.test.cjs'),
  path.join(root, 'tests-v3', 'palette-contract.test.cjs'),
  path.join(root, 'tests-v3', 'updates.test.cjs')
]);

console.log('WARD fallback release check passed. Browser-only checks were not run.');
