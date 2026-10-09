'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const QUIET_LINE = /const QUIET_RELEASES = Object\.freeze\((\[[^\]\n]*\])\);/;
const quietList = text => JSON.parse(text.match(QUIET_LINE)[1]);
const quietHeadings = text => [...text.matchAll(/^## (\d+\.\d+\.\d+) .*\(quiet\)\s*$/gm)].map(m => m[1]);

test('changelog (quiet) headings and QUIET_RELEASES agree', () => {
  const listed = quietList(read('src/release-notes.js'));
  assert.deepEqual([...listed].sort(), quietHeadings(read('CHANGELOG.md')).sort());
  for (const version of listed) assert.ok(read('src/release-notes.js').includes(`'${version}': [`), `${version} needs release notes`);
});

test('release notes expose isQuietUpgrade backed by Core', () => {
  const source = read('src/release-notes.js');
  assert.match(source, QUIET_LINE);
  assert.match(source, /ExtraPotionsCore\.isQuietUpgrade\(previous, EXP\.VERSION, Object\.keys\(/);
  assert.match(source, /isQuietUpgrade, QUIET_RELEASES/);
});

function prepare(env) {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'quiet-prepare-'));
  for (const file of ['package.json', 'package-lock.json', 'CHANGELOG.md', 'src/metadata.txt', 'src/main.js', 'src/release-notes.js', 'scripts/prepare-feature-release.cjs']) {
    fs.mkdirSync(path.dirname(path.join(work, file)), { recursive: true });
    fs.copyFileSync(path.join(root, file), path.join(work, file));
  }
  execFileSync(process.execPath, [path.join(work, 'scripts/prepare-feature-release.cjs')], {
    env: { ...process.env, RELEASE_NOTES_JSON: JSON.stringify(['First note.', 'Second note.']), ...env }, stdio: 'pipe',
  });
  const out = name => fs.readFileSync(path.join(work, name), 'utf8');
  const version = JSON.parse(out('package.json')).version;
  const result = { version, changelog: out('CHANGELOG.md'), notes: out('src/release-notes.js') };
  fs.rmSync(work, { recursive: true, force: true });
  return result;
}

test('RELEASE_QUIET=1 marks both the changelog heading and QUIET_RELEASES', () => {
  const { version, changelog, notes } = prepare({ RELEASE_QUIET: '1' });
  assert.match(changelog.split('\n')[0], new RegExp(`^## ${version.replaceAll('.', '\\.')} (—|-) \\d{4}-\\d{2}-\\d{2} \\(quiet\\)$`));
  assert.equal(quietList(notes)[0], version);
  assert.deepEqual([...quietList(notes)].sort(), quietHeadings(changelog).sort());
});

test('a normal release leaves QUIET_RELEASES alone and adds no marker', () => {
  const before = quietList(read('src/release-notes.js'));
  const { changelog, notes } = prepare({});
  assert.doesNotMatch(changelog.split('\n')[0], /\(quiet\)/);
  assert.deepEqual(quietList(notes), before);
});

test('the Core-sync bot heading format passes the quiet consistency check', () => {
  // prepare-core-release.cjs writes "## <next> — <date>" with no marker and never touches QUIET_RELEASES.
  const changelog = `## 9.9.9 — 2026-10-12\n\n- Includes exp-core 9.9.9.\n- Keeps every setting.\n\n${read('CHANGELOG.md')}`;
  assert.deepEqual([...quietList(read('src/release-notes.js'))].sort(), quietHeadings(changelog).sort());
});
