'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

test('distribution is reproducible and has clean V3 metadata', () => {
  execFileSync(process.execPath, [path.join(root, 'scripts/build.cjs'), '--check'], { cwd: root, stdio: 'pipe' });
  const source = fs.readFileSync(path.join(root, 'ward.user.js'), 'utf8');
  assert.match(source, /@name\s+WARD/);
  assert.match(source, new RegExp(`@version\\s+${pkg.version.replaceAll('.', '\\.')}`));
  assert.deepEqual(Buffer.from(source.match(/^\/\/ @icon\s+data:image\/svg\+xml;base64,(.+)$/m)[1], 'base64'), fs.readFileSync(path.join(root, 'assets', 'ward.svg')));
  assert.match(source, /@match\s+https:\/\/www\.amazon\.com\/\*/);
  assert.match(source, /@homepageURL\s+https:\/\/github\.com\/ExtraPotions\/WARD/);
  assert.match(source, /@updateURL\s+https:\/\/github\.com\/ExtraPotions\/WARD\/releases\/latest\/download\/ward\.user\.js/);
  assert.match(source, /api\.github\.com\/repos\/ExtraPotions\/WARD\/releases\/latest/);
  assert.doesNotMatch(source, /dark-pattern-blockers\/releases/);
  assert.doesNotMatch(source, /adpb:amazon:/);
  assert.doesNotMatch(source, /Amazon Dark Pattern Blocker/);
  assert.doesNotMatch(source, /amazon-dark-pattern-blocker/);
  const leftovers = [
    'amazon-dark-pattern-blocker.user.js',
    'scripts/release.ps1',
    'release-notes.md',
    'RELEASE-NOTES-3.0.1.md',
    'RELEASE-NOTES-3.0.5.md',
    'docs/visual-evidence',
    'docs/visual-fidelity-checkpoint.md',
    'docs/checkpoint-h.md',
    'icon.png',
    'icon-64.png',
    'icon-128.png',
    'badge.svg',
    'docs/menu-desktop.png',
    'docs/menu-mobile.png',
    'tests/browser.cjs',
    'tests/harness.html',
    'tests/info-buttons.cjs',
    'tests/menu-layout.cjs',
    'tests/upgrade-matrix.cjs',
    'dist-parts'
  ];
  for (const file of leftovers) {
    assert.equal(fs.existsSync(path.join(root, file)), false, `leftover file still present: ${file}`);
  }
  const bytes = Buffer.byteLength(source);
  assert.ok(bytes >= 100000 && bytes <= 400000, `install size ${bytes} is outside 100-400KB`);
  assert.doesNotMatch(source, /@resource/);
  assert.doesNotMatch(source, /GM_getResourceText/);
  assert.doesNotMatch(source, /expPart0/);
  const changelog = fs.readFileSync(path.join(root, 'CHANGELOG.md'), 'utf8');
  assert.doesNotMatch(changelog, /Amazon Reveal|Dark Pattern Blocker settings/);
  assert.match(source, /function protectLauncherHost/);
  assert.match(source, /setInterval\(ensure, 2000\)/);
  assert.equal([...source.matchAll(/setInterval\s*\(/g)].length, 1);
  const launcher = fs.readFileSync(path.join(root, 'assets', 'ward-launcher.svg'), 'utf8');
  const badge = fs.readFileSync(path.join(root, 'assets', 'ward.svg'));
  assert.equal(crypto.createHash('sha256').update(badge).digest('hex'), '1a9d50bf274a0793f94d8117ef6cc3f68e4839edf5bc932d49c9ad7800bcb0f9');
  assert.equal(crypto.createHash('sha256').update(launcher).digest('hex'), 'c1a12bad2c6145ce097dc139177293a5832824b97a251324da58b98dcf4a8702');
  assert.ok(source.includes(`data:image/svg+xml;base64,${Buffer.from(launcher).toString('base64')}`));
  assert.doesNotMatch(launcher, /<rect x="32"|<rect x="42"|id="border"/u);
  assert.doesNotMatch(source, /__EXP_WARD_LAUNCHER_DATA__/u);
  assert.match(source, /createDiagnosticsReport\(\s*'WARD'/);
});

test('approved badge derivatives have exact pixel dimensions', () => {
  for (const size of [128, 48, 32]) {
    const png = fs.readFileSync(path.join(root, 'assets', `ward-${size}.png`));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }
});

test('production menu uses switches and has every required navigation group', async (t) => {
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  const page = await browser.newPage();
  await page.route('https://www.amazon.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html><body><main>Amazon fixture</main></body></html>' }));
  await page.goto('https://www.amazon.com/');
  await page.addScriptTag({ content: fs.readFileSync(path.join(root, 'ward.user.js'), 'utf8') });
  await page.locator('#exp-ward-root').evaluate((host) => host.shadowRoot.querySelector('.ward-launcher').click());
  const result = await page.locator('#exp-ward-root').evaluate((host) => { const root = host.shadowRoot; const panel = root.querySelector('.ward');root.querySelector('.version').click();const changelog=root.querySelector('.ward-version-changelog'); return { nav: [...root.querySelectorAll('.ward-nav > .tool-panel > .route')].map((node) => node.querySelector('.fl-tool-title')?.textContent), switches: root.querySelectorAll('[role="switch"]').length, checkboxes: root.querySelectorAll('input[type="checkbox"]').length, open: panel.classList.contains('open'), role: panel.getAttribute('role'), modal: panel.getAttribute('aria-modal'), launcherExpanded: root.querySelector('.ward-launcher').getAttribute('aria-expanded'), width: panel.getBoundingClientRect().width, sections: root.querySelectorAll('.tool-panel').length, visibleBodies: [...root.querySelectorAll('.route-body')].filter((body) => !body.hidden).length, openRoute: root.querySelector('.route[aria-expanded="true"] .fl-tool-title')?.textContent, changelogOutside:!panel.contains(changelog) }; });
  assert.equal(result.open, true);
  assert.equal(result.checkboxes, 0);
  assert.equal(result.switches, 0);
  assert.equal(result.role, 'dialog');
  assert.equal(result.modal, 'true');
  assert.equal(result.launcherExpanded, 'true');
  assert.equal(result.width, 260);
  assert.equal(result.sections, 3);
  assert.equal(result.visibleBodies, 0);
  assert.equal(result.changelogOutside, true);
  const notice = await page.locator('#exp-ward-root').evaluate((host) => {
    const changelog = host.shadowRoot.querySelector('.ward-version-changelog');
    return {
      versionLabel: host.shadowRoot.querySelector('.version')?.textContent || '',
      heading: changelog?.querySelector('strong')?.textContent || '',
      bullets: [...(changelog?.querySelectorAll('li') || [])].map((item) => item.textContent.trim()),
      hasList: Boolean(changelog?.querySelector('ul')),
      visible: !changelog?.hidden,
      role: changelog?.getAttribute('role') || '',
    };
  });
  assert.equal(notice.versionLabel, `v${pkg.version}`);
  assert.equal(notice.heading, `WARD Changelog · v${pkg.version}`);
  assert.equal(notice.hasList, true);
  assert.ok(notice.bullets.length >= 2 && notice.bullets.length <= 4, JSON.stringify(notice));
  assert.ok(notice.bullets.every((item) => item !== 'Current WARD improvements and fixes.'));
  assert.equal(result.openRoute, undefined);
  const launcherChrome = await page.locator('#exp-ward-root').evaluate((host) => { const root=host.shadowRoot;const launcher=root.querySelector('.ward-launcher');return {button:Math.round(launcher.getBoundingClientRect().width),radius:getComputedStyle(launcher).borderRadius,hasRing:Boolean(root.querySelector('.launcher-ring')),icon:Math.round(root.querySelector('.launcher-icon').getBoundingClientRect().width),headerBadge:Math.round(root.querySelector('.header-icon .menu-icon').getBoundingClientRect().width)}; });
  assert.deepEqual(launcherChrome,{button:48,radius:'10px',hasRing:false,icon:40,headerBadge:38});
  for (const label of ['Protection','Appearance','Amazon']) assert.ok(result.nav.includes(label));
  assert.equal(result.nav.includes('Settings'), false);
  assert.equal(result.nav.includes('Read'), false);
  assert.equal(result.nav.includes('Recover'), false);
  const changed = await page.locator('#exp-ward-root').evaluate((host) => { const root = host.shadowRoot; root.querySelector('.route[data-view="tools"]').click(); return { visibleBodies: [...root.querySelectorAll('.route-body')].filter((body) => !body.hidden).length, openRoute: root.querySelector('.route[aria-expanded="true"] .fl-tool-title')?.textContent, coupon: root.querySelector('[role="switch"][aria-label="Auto-clip coupons"]')?.getAttribute('aria-checked'), switches:root.querySelectorAll('[role="switch"]').length, nested: root.querySelectorAll('.route-body:not([hidden]) details').length }; });
  assert.equal(changed.visibleBodies, 1);
  assert.equal(changed.openRoute, 'Amazon');
  assert.equal(changed.coupon, 'true');
  assert.equal(changed.nested, 0);
  assert.ok(changed.switches > 0);
  const reopened = await page.locator('#exp-ward-root').evaluate((host) => { const root=host.shadowRoot;root.querySelector('.ward-launcher').click();root.querySelector('.ward-launcher').click();return {visibleBodies:[...root.querySelectorAll('.route-body')].filter((body)=>!body.hidden).length,marker:root.querySelector('.route.last-opened')?.textContent}; });
  assert.deepEqual(reopened,{visibleBodies:0,marker:'Amazon▸'});
});

test('version and update-complete cards show the concise current changelog', async (t) => {
  const browser = await chromium.launch({ headless:true });
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.route('https://www.amazon.com/**', (route) => route.fulfill({ status:200, contentType:'text/html', body:'<!doctype html><html><body><main>Amazon fixture</main></body></html>' }));
  await page.goto('https://www.amazon.com/');
  await page.evaluate(() => localStorage.setItem('exp:v3:ward:last-version-v2','3.2.3'));
  await page.addScriptTag({ content:fs.readFileSync(path.join(root,'ward.user.js'),'utf8') });
  await page.waitForSelector('#exp-ward-root', { state:'attached' });
  const facts = await page.locator('#exp-ward-root').evaluate((host) => {
    const root=host.shadowRoot;
    const completed=root.querySelector('.ward-update-changelog');
    root.querySelector('.version').click();
    const current=root.querySelector('.ward-version-changelog');
    const read=(node)=>({title:node.querySelector('.update-title')?.textContent||node.querySelector('strong')?.textContent||'',bullets:[...node.querySelectorAll('li')].map((item)=>item.textContent.trim()),visible:!node.hidden});
    return {completed:read(completed),current:read(current)};
  });
  assert.equal(facts.completed.title,'WARD Updated');
  assert.equal(facts.completed.visible,true);
  assert.ok(facts.completed.bullets.length>=2&&facts.completed.bullets.length<=4,JSON.stringify(facts));
  assert.equal(facts.current.title,`WARD Changelog · v${pkg.version}`);
  assert.equal(facts.current.visible,true);
  assert.deepEqual(facts.current.bullets,facts.completed.bullets);
});
