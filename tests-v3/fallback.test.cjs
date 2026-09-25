'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

test('release version is synchronized across source, metadata, changelog, lockfile, and distribution', () => {
  const pkg = JSON.parse(read('package.json'));
  const lock = JSON.parse(read('package-lock.json'));
  const version = pkg.version;
  assert.equal(lock.version, version);
  assert.equal(lock.packages[''].version, version);
  assert.match(read('src/main.js'), new RegExp(`EXP\\.VERSION = '${version.replaceAll('.', '\\.')}'`));
  assert.match(read('src/metadata.txt'), new RegExp(`^// @version\\s+${version.replaceAll('.', '\\.')}$`, 'm'));
  assert.match(read('ward.user.js'), new RegExp(`^// @version\\s+${version.replaceAll('.', '\\.')}$`, 'm'));
  assert.match(read('CHANGELOG.md'), new RegExp(`^## ${version.replaceAll('.', '\\.')} - `, 'm'));
  assert.match(read('src/release-notes.js'), new RegExp(`'${version.replaceAll('.', '\\.')}'`));
});

test('every sanitized Amazon fixture maps only to declared detector IDs', () => {
  const adapter = read('src/amazon-adapter.js');
  const declared = new Set([...adapter.matchAll(/\{ id: '(amazon\.[a-z.-]+)'/g)].map((match) => match[1]));
  assert.equal(declared.size, 11);
  for (const name of ['home', 'search', 'product', 'cart', 'checkout', 'dynamic']) {
    const fixture = read(`tests-v3/fixtures/amazon/${name}.html`);
    const expected = fixture.match(/data-expected-detectors="([^"]+)"/)?.[1].split(',') || [];
    assert.ok(expected.length > 0, `${name} declares expected detectors`);
    for (const id of expected) assert.ok(declared.has(id), `${name} uses declared detector ${id}`);
    assert.doesNotMatch(fixture, /<script|https?:\/\/|value\s*=/i, `${name} remains sanitized`);
  }
});

test('generated userscript orders CSP styles and release notes before their consumers', () => {
  const script = read('ward.user.js');
  const styles = script.indexOf('EXP.PageStyles = (() => {');
  const actions = script.indexOf('EXP.Actions = (() => {');
  const notes = script.indexOf('EXP.ReleaseNotes = (() => {');
  const ui = script.indexOf('EXP.UI = (() => {');
  assert.ok(styles >= 0 && styles < actions);
  assert.ok(notes >= 0 && notes < ui);
  assert.match(script, /Resume coupon clipping/);
  assert.match(script, /data-exp-adapter-health/);
  assert.match(script, /Reapply protection/);
});

test('current Amazon product modules and route-wide coverage protections ship in the bundle', () => {
  const script = read('ward.user.js');
  for (const marker of ['insuranceAndWarranty_feature_div', 'businessSavings_feature_div', 'routeMatchedDetectors', 'EXP.Core.injectStyle(document, css, data)']) {
    assert.match(script, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});

test('visual capture manifest targets the current theme and fixture set without deprecated warm output', () => {
  const capture = read('scripts/capture-visuals.cjs');
  for (const file of ['current-fixture.png', 'menu-overview.png', 'ember.png', 'midnight.png', 'high-contrast.png', 'pride.png', 'ward-gem.png']) {
    assert.match(capture, new RegExp(file.replaceAll('.', '\\.')));
  }
  assert.doesNotMatch(capture, /warm-charcoal\.png/);
});
