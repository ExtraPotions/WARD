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

const ID = 'ward', HOST = '#exp-ward-root', NAME = 'WARD', PAGE = 'https://www.amazon.com/', SEP = '-';
const vm = require('node:vm');
const { chromium } = require('playwright');
const { loadSource } = require('./load-source.cjs');

const releasedVersions = () => [...read('src/release-notes.js').matchAll(/^\s*'(\d+\.\d+\.\d+)': \[/gm)].map(m => m[1]);
const body = (version, quiet) => `## ${version} ${SEP} 2026-10-12${quiet ? ' (quiet)' : ''}\n\n- First.\n- Second.`;

async function boot(t, { release = null, previous = null, quiet = null } = {}) {
  const browser = await chromium.launch(); t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  let source = loadSource();
  if (quiet) source = source.replace(QUIET_LINE, `const QUIET_RELEASES = Object.freeze(${JSON.stringify(quiet)});`);
  await page.addInitScript(({ release, previous, id }) => {
    const values = new Map(previous ? [[`exp:v3:${id}:installed-version`, previous]] : []);
    window.GM_getValue = (k, f) => values.has(k) ? values.get(k) : f;
    window.GM_setValue = (k, v) => values.set(k, v);
    window.GM_deleteValue = k => values.delete(k);
    window.GM_xmlhttpRequest = o => {
      if (release && String(o.url).includes('api.github.com')) setTimeout(() => o.onload({ status: 200, responseText: JSON.stringify(release) }), 0);
      return { abort() {} };
    };
  }, { release, previous, id: ID });
  await page.route(`${PAGE}**`, r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body><p>Quiet release fixture</p></body></html>' }));
  await page.goto(PAGE);
  await page.addScriptTag({ content: source });
  await page.waitForSelector(HOST, { state: 'attached' });
  return page;
}
const facts = page => page.locator(HOST).evaluate(host => {
  const launcher = host.shadowRoot.querySelector('[data-exp-part="launcher"]');
  const notice = host.shadowRoot.querySelector('.exp-floating-update');
  return { badge: launcher.classList.contains('update-available'), label: launcher.getAttribute('aria-label'), card: Boolean(notice && !notice.hidden), text: notice?.textContent || '' };
});
const cardShown = page => page.waitForFunction(h => { const n = document.querySelector(h)?.shadowRoot?.querySelector('.exp-floating-update'); return n && !n.hidden; }, HOST, { timeout: 5000 });
const badgeShown = page => page.waitForFunction(h => document.querySelector(h)?.shadowRoot?.querySelector('[data-exp-part="launcher"]')?.classList.contains('update-available'), HOST, { timeout: 5000 });

test('a normal available update shows the badge, label, and card (control)', async t => {
  const page = await boot(t, { release: { tag_name: 'v99.0.0', body: body('99.0.0', false) } });
  await cardShown(page);
  const f = await facts(page);
  assert.equal(f.badge, true);
  assert.equal(f.label, `Open ${NAME} · Update v99.0.0 Available`);
  assert.match(f.text, /Update Available/);
});

test('a quiet available update shows only the badge and label', async t => {
  const page = await boot(t, { release: { tag_name: 'v99.0.0', body: body('99.0.0', true) } });
  await badgeShown(page);
  await page.waitForTimeout(500);
  const f = await facts(page);
  assert.equal(f.card, false);
  assert.equal(f.label, `Open ${NAME} · Update v99.0.0 Available`);
});

test('Update Complete is skipped when every skipped release is quiet', async t => {
  const [current, previous] = releasedVersions();
  const page = await boot(t, { previous, quiet: [current] });
  await page.waitForTimeout(1500);
  assert.equal((await facts(page)).card, false);
});

test('Update Complete still shows when a skipped release was normal', async t => {
  const [current, , older] = releasedVersions();
  const page = await boot(t, { previous: older, quiet: [current] });
  await cardShown(page);
  assert.match((await facts(page)).text, /Update Complete/);
});

function loadSettings(stored) {
  const store = new Map(stored ? [[`exp:v3:${ID}:settings`, stored]] : []);
  const context = vm.createContext({
    EXP: { VERSION: 'fixture' }, location: { hostname: 'example.com' },
    ExtraPotionsCore: { cloneSettings: v => JSON.parse(JSON.stringify(v)), productDataResetting: () => false },
    GM_getValue: (k, f) => store.has(k) ? store.get(k) : f, GM_setValue: (k, v) => store.set(k, v),
  });
  vm.runInContext(read('src/settings.js'), context);
  context.EXP.Settings.load();
  return context.EXP.Settings.snapshot();
}

test('new installs check for updates by default; a saved false stays false', () => {
  assert.equal(loadSettings(null).updateNotifications, true);
  assert.equal(loadSettings({ schema: 1, updateNotifications: false }).updateNotifications, false);
});
