'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'release.yml'), 'utf8');

test('Core updates do not start downstream publication', () => {
  assert.equal(fs.existsSync(path.join(root, '.github/workflows/sync-exp-core.yml')), false);
  assert.match(workflow, /workflow_dispatch:/u);
  assert.doesNotMatch(workflow, /repository_dispatch:|schedule:|consumer-rollout|needs:/u);
});
