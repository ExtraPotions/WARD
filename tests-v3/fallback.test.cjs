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

test('readable assembly orders CSP styles and release notes before their consumers', () => {
  const script = read('ward.user.js');
  // Ordering is a source contract; installed UI markers remain checked below.
  const readable = require('./load-source.cjs').loadSource();
  const styles = readable.indexOf('EXP.PageStyles = (() => {');
  const actions = readable.indexOf('EXP.Actions = (() => {');
  const notes = readable.indexOf('EXP.ReleaseNotes = (() => {');
  const ui = readable.indexOf('EXP.UI = (() => {');
  assert.ok(styles >= 0 && styles < actions);
  assert.ok(notes >= 0 && notes < ui);
  assert.match(script, /Resume coupon clipping/);
  assert.match(script, /data-exp-adapter-health/);
  assert.match(script, /Reapply protection/);
});

test('current Amazon product modules and route-wide coverage protections ship in the bundle', () => {
  const script = read('ward.user.js');
  for (const marker of ['insuranceAndWarranty_feature_div', 'businessSavings_feature_div', 'matchedDetectors']) {
    assert.ok(script.includes(marker), marker);
  }
  assert.match(script, /\.Core\.injectStyle\(document,/);
  const readable = require('./load-source.cjs').loadSource();
  assert.ok(readable.includes('routeMatchedDetectors'));
  assert.ok(readable.includes('EXP.Core.injectStyle(document, css, data)'));
});

// screenshots-config.test.cjs checks the shot list against the README.
test('the README shot list has no theme or warm output', () => {
  assert.doesNotMatch(read('docs/screenshots.config.cjs'), /warm-charcoal\.png/);
});
