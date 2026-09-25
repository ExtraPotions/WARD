'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
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
  assert.match(source, /^\/\/ @icon\s+https:\/\/raw\.githubusercontent\.com\/ExtraPotions\/WARD\/main\/assets\/ward-launcher\.svg$/m);
  assert.doesNotMatch(source, /data:image\//u);
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
  assert.ok(source.includes('https://raw.githubusercontent.com/ExtraPotions/WARD/main/assets/ward-launcher.svg'));
  assert.doesNotMatch(launcher, /<rect x="32"|<rect x="42"|id="border"/u);
  assert.doesNotMatch(source, /__EXP_WARD_LAUNCHER_DATA__/u);
  for (const removed of ['ward.svg', 'ward-128.png', 'ward-48.png', 'ward-32.png']) {
    assert.equal(fs.existsSync(path.join(root, 'assets', removed)), false, removed);
  }
  assert.match(source, /createDiagnosticsReport\(\s*'WARD'/);
});

test('production menu uses switches and has every required navigation group', async (t) => {
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  const page = await browser.newPage();
  await page.route('https://www.amazon.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html><body><main>Amazon fixture</main></body></html>' }));
  await page.goto('https://www.amazon.com/');
  await page.addScriptTag({ content: fs.readFileSync(path.join(root, 'ward.user.js'), 'utf8') });
  await page.locator('#exp-ward-root').evaluate((host) => host.shadowRoot.querySelector('.ward-launcher').click());
  const result = await page.locator('#exp-ward-root').evaluate((host) => {
    const root = host.shadowRoot;
    const panel = root.querySelector('.ward');
    root.querySelector('.version').click();
    const notice = root.querySelector('.ward-update-changelog');
    return {
      nav: [...root.querySelectorAll('.ward-nav > .tool-panel > .route')].map((node) => node.querySelector('.fl-tool-title')?.textContent),
      switches: root.querySelectorAll('[role="switch"]').length,
      checkboxes: root.querySelectorAll('input[type="checkbox"]').length,
      open: panel.classList.contains('open'),
      role: panel.getAttribute('role'),
      modal: panel.getAttribute('aria-modal'),
      launcherExpanded: root.querySelector('.ward-launcher').getAttribute('aria-expanded'),
      width: panel.getBoundingClientRect().width,
      sections: root.querySelectorAll('.tool-panel').length,
      visibleBodies: [...root.querySelectorAll('.route-body')].filter((body) => !body.hidden).length,
      openRoute: root.querySelector('.route[aria-expanded="true"] .fl-tool-title')?.textContent,
      noticeOutside: !panel.contains(notice),
      notice: {
        title: notice?.querySelector('.update-title')?.textContent || '',
        version: notice?.querySelector('.update-version')?.textContent || '',
        bullets: [...(notice?.querySelectorAll('li') || [])].map((item) => item.textContent.trim()),
        hasList: Boolean(notice?.querySelector('ul')),
        visible: !notice?.hidden,
        role: notice?.getAttribute('role') || '',
      },
    };
  });
  assert.equal(result.open, true);
  assert.equal(result.checkboxes, 0);
  assert.equal(result.switches, 0);
  assert.equal(result.role, 'dialog');
  assert.equal(result.modal, 'true');
  assert.equal(result.launcherExpanded, 'true');
  assert.equal(result.width, 260);
  assert.equal(result.sections, 4);
  assert.equal(result.visibleBodies, 0);
  assert.equal(result.noticeOutside, true);
  assert.equal(result.notice.title, 'WARD Changelog');
  assert.equal(result.notice.version, `v${pkg.version}`);
  assert.equal(result.notice.hasList, true);
  assert.ok(result.notice.bullets.length >= 2 && result.notice.bullets.length <= 4, JSON.stringify(result.notice));
  assert.ok(result.notice.bullets.every((item) => item !== 'Current WARD improvements and fixes.'));
  assert.equal(result.openRoute, undefined);
  const launcherChrome = await page.locator('#exp-ward-root').evaluate((host) => {
    const root=host.shadowRoot;const launcher=root.querySelector('.ward-launcher');
    return {button:Math.round(launcher.getBoundingClientRect().width),radius:getComputedStyle(launcher).borderRadius,hasRing:Boolean(root.querySelector('.launcher-ring')),icon:Math.round(root.querySelector('.launcher-icon').getBoundingClientRect().width),headerBadge:Math.round(root.querySelector('.header-icon .menu-icon').getBoundingClientRect().width)};
  });
  assert.deepEqual(launcherChrome,{button:48,radius:'10px',hasRing:false,icon:40,headerBadge:38});
  for (const label of ['Protection','Appearance','Amazon','System']) assert.ok(result.nav.includes(label));
  assert.equal(result.nav.includes('Settings'), false);
  assert.equal(result.nav.includes('Read'), false);
  assert.equal(result.nav.includes('Recover'), false);
  const changed = await page.locator('#exp-ward-root').evaluate((host) => {
    const root = host.shadowRoot; root.querySelector('.route[data-view="tools"]').click();
    return { visibleBodies: [...root.querySelectorAll('.route-body')].filter((body) => !body.hidden).length, openRoute: root.querySelector('.route[aria-expanded="true"] .fl-tool-title')?.textContent, coupon: root.querySelector('[role="switch"][aria-label="Auto-clip coupons"]')?.getAttribute('aria-checked'), switches:root.querySelectorAll('[role="switch"]').length, nested: root.querySelectorAll('.route-body:not([hidden]) details').length };
  });
  assert.equal(changed.visibleBodies, 1);
  assert.equal(changed.openRoute, 'Amazon');
  assert.equal(changed.coupon, 'true');
  assert.equal(changed.nested, 0);
  assert.ok(changed.switches > 0);
  const reopened = await page.locator('#exp-ward-root').evaluate((host) => {
    const root=host.shadowRoot;root.querySelector('.ward-launcher').click();root.querySelector('.ward-launcher').click();
    return {visibleBodies:[...root.querySelectorAll('.route-body')].filter((body)=>!body.hidden).length,marker:root.querySelector('.route.last-opened')?.textContent};
  });
  assert.deepEqual(reopened,{visibleBodies:0,marker:'Amazon▸'});
});

test('version action reuses the update-complete card for the current changelog', async (t) => {
  const browser = await chromium.launch({ headless:true });
  t.after(() => browser.close());
  const page = await browser.newPage();
  await page.route('https://www.amazon.com/**', (route) => route.fulfill({ status:200, contentType:'text/html', body:'<!doctype html><html><body><main>Amazon fixture</main></body></html>' }));
  await page.goto('https://www.amazon.com/');
  await page.evaluate(() => localStorage.setItem('exp:v3:ward:last-version-v2','3.2.12'));
  await page.addScriptTag({ content:fs.readFileSync(path.join(root,'ward.user.js'),'utf8') });
  await page.waitForSelector('#exp-ward-root', { state:'attached' });
  const facts = await page.locator('#exp-ward-root').evaluate((host) => {
    const root=host.shadowRoot;
    const card=root.querySelector('.ward-update-changelog');
    const read=(node)=>({kind:node.dataset.noticeKind,title:node.querySelector('.update-title')?.textContent||'',version:node.querySelector('.update-version')?.textContent||'',bullets:[...node.querySelectorAll('li')].map((item)=>item.textContent.trim()),visible:!node.hidden});
    const completed=read(card);
    root.querySelector('.version').click();
    const current=read(card);
    return {completed,current,sameNode:card===root.querySelector('.ward-update-changelog')};
  });
  assert.equal(facts.sameNode,true);
  assert.equal(facts.completed.kind,'complete');
  assert.equal(facts.completed.title,'WARD Updated');
  assert.equal(facts.completed.visible,true);
  assert.ok(facts.completed.bullets.length>=2&&facts.completed.bullets.length<=4,JSON.stringify(facts));
  assert.equal(facts.current.kind,'current');
  assert.equal(facts.current.title,'WARD Changelog');
  assert.equal(facts.current.version,`v${pkg.version}`);
  assert.equal(facts.current.visible,true);
  assert.deepEqual(facts.current.bullets,facts.completed.bullets);
});

test('WARD settings survive manager storage gaps and saved width is respected', () => {
  const settings = fs.readFileSync(path.join(root, 'src', 'settings.js'), 'utf8');
  const ui = fs.readFileSync(path.join(root, 'src', 'ui.js'), 'utf8');
  assert.match(settings, /const value = GM_getValue\(storageKey, undefined\);\s*if \(value !== undefined\) return value;/u);
  assert.match(settings, /const value = localStorage\.getItem\(storageKey\);\s*if \(value !== null\) \{/u);
  assert.match(settings, /if \(typeof GM_setValue === 'function'\) GM_setValue\(storageKey, parsed\);/u);
  assert.match(settings, /if \(typeof GM_setValue === 'function'\) GM_setValue\(storageKey, value\);/u);
  assert.match(settings, /localStorage\.setItem\(storageKey, JSON\.stringify\(value\)\);/u);
  assert.match(settings, /function load\(\) \{\s*const stored = read\('settings'\);\s*state = validate\(stored \|\| defaults\);\s*write\('settings', state\);/u);
  assert.doesNotMatch(settings, /GM_setValue\(key\(name\), value\); return;/u);
  assert.match(ui, /host\.dataset\.menuWidth = settings\.menuWidth;/u);
  assert.doesNotMatch(ui, /host\.dataset\.menuWidth = 'compact';/u);
});

