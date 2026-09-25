'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');

test('WARD V3 settings are clean, validated, and coupon clipping defaults on', () => {
  const source = read('src/settings.js');
  assert.match(source, /const PREFIX = 'exp:v3:ward'/);
  assert.match(source, /autoClipCoupons: true/);
  assert.match(source, /compactSearch: false/);
  assert.doesNotMatch(source, /adpb:amazon|GM_listValues|legacy/i);
});

test('pattern registry defines unique concepts rather than selectors', () => {
  const source = read('src/patterns.js');
  const ids = [...source.matchAll(/id: '([a-z][a-z0-9.-]+)'/g)].map((match) => match[1]);
  assert.equal(ids.length, 11);
  assert.equal(new Set(ids).size, ids.length);
  assert.doesNotMatch(source, /querySelector|#[a-z]|\[[a-z-]+=/i);
});

test('generic action layer cannot click, navigate, submit, or change native selections', () => {
  const source = read('src/actions.js');
  assert.doesNotMatch(source, /\.click\s*\(|location\s*=|location\.href|\.submit\s*\(|\.checked\s*=/);
  for (const action of ['hide', 'dim', 'collapse', 'annotate', 'allow']) assert.match(source, new RegExp(`'${action}'`));
});

test('Amazon adapter owns selectors and the coupon gate is narrow', () => {
  const source = read('src/amazon-adapter.js');
  assert.match(source, /ward\.retailer\.amazon/);
  assert.match(source, /s-coupon-component/);
  assert.match(source, /unsafe-context/);
  assert.match(source, /placeYourOrder1/);
  assert.doesNotMatch(source, /\.click\s*\(/);
});

test('runtime contains no unconditional polling loop or raw error message diagnostics', () => {
  const source = ['src/audit.js','src/amazon-adapter.js','src/activity.js','src/page-styles.js','src/actions.js','src/layout.js','src/engine.js','src/release-notes.js','src/ui.js','src/main.js'].map(read).join('\n');
  assert.doesNotMatch(source, /setInterval\s*\(/);
  assert.doesNotMatch(source, /error\.message|outerHTML/);
});

test('launcher host protection restores the overlay with a bounded interval', () => {
  const source = read('vendor/exp-core/exp-core.js');
  assert.match(source, /function protectLauncherHost/);
  assert.match(source, /setInterval\(ensure, 2000\)/);
  assert.match(source, /showPopover/);
  assert.match(source, /return \(\) => \{/);
});

test('launcher measurements and badge assets match the shared suite contract', () => {
  const core = read('vendor/exp-core/exp-core.js');
  assert.match(core, /\[data-exp-part="launcher"\]\{[^}]*width:48px!important;[^}]*height:48px!important/u);
  assert.match(core, /\[data-exp-part="launcher"\] \.launcher-icon\{width:40px!important;height:40px!important\}/u);
  assert.match(core, /\.header-icon \.menu-icon\{width:38px!important;height:38px!important\}/u);
  assert.match(core, /launcher\.replaceChildren\(mark\)/u);
  assert.doesNotMatch(core, /launcher\.append\(ring/u);
  const launcher = fs.readFileSync(path.join(root, 'assets', 'ward-launcher.svg'));
  assert.equal(crypto.createHash('sha256').update(launcher).digest('hex'), 'c1a12bad2c6145ce097dc139177293a5832824b97a251324da58b98dcf4a8702');
  for (const removed of ['ward.svg', 'ward-128.png', 'ward-48.png', 'ward-32.png']) {
    assert.equal(fs.existsSync(path.join(root, 'assets', removed)), false, removed);
  }
});

test('engine batches never rebuild the open menu', () => {
  const source = read('src/engine.js');
  assert.doesNotMatch(source, /EXP\.UI\?\.refresh\?\./);
  assert.match(source, /refreshActivity/);
  assert.match(source, /restack/);
});

test('in-app update notice uses a version heading and concise bullet list', () => {
  const source = read('src/ui.js');
  const releaseNotes = read('src/release-notes.js');
  const updates = read('src/updates.js');
  const workflow = read('.github/workflows/release.yml');
  const { version } = JSON.parse(read('package.json'));
  assert.match(source, /function updateNotice\(\)/);
  assert.match(source, /el\('strong','',`WARD Changelog · v\$\{EXP\.VERSION\}`\)/);
  assert.match(source, /el\('ul'\)/);
  assert.match(source, /el\('li','',item\)/);
  assert.match(source, /EXP\.ReleaseNotes\.current\(\)/);
  assert.match(source, /complete\?EXP\.ReleaseNotes\.current\(\)/);
  assert.match(source, /result\.details/);
  assert.match(updates, /function releaseDetails\(body\)/);
  assert.match(workflow, /--notes-file release-notes\.md/);
  assert.doesNotMatch(workflow, /--generate-notes/);
  assert.match(releaseNotes, new RegExp(`'${version.replaceAll('.', '\\.')}'`));
  assert.doesNotMatch(source, /el\('div','changelog','Version/);
});


test('audit source never captures page text, selectors, form values, URLs, or DOM markup', () => {
  const source = read('src/audit.js');
  assert.doesNotMatch(source, /textContent|innerText|outerHTML|innerHTML|location\.|querySelector|value\b/);
  assert.match(source, /Detector and action metadata only/);
  assert.match(source, /requestedAction/);
  assert.match(source, /appliedAction/);
});

test('revealed interventions can be protected again per item or for the whole page', () => {
  const actions = read('src/actions.js');
  const ui = read('src/ui.js');
  assert.match(actions, /exp-ward-reprotect/);
  assert.match(actions, /function endReveal\(id\)/);
  assert.match(actions, /EXP\.Activity\.conceal\(id\)/);
  assert.match(ui, /Reapply protection/);
  assert.match(ui, /Protect again/);
});

test('Custom mode exposes action, confidence, explanation, category, and pattern policy controls', () => {
  const ui = read('src/ui.js');
  for (const marker of ['Default action', 'Confidence policy', 'Explanation detail', 'Category controls', 'Individual patterns']) {
    assert.match(ui, new RegExp(marker));
  }
  assert.match(ui, /\['inherit','Inherit'\]/);
  assert.match(ui, /settings\.protectionLevel === 'custom'/);
});

test('activity UI explains actions and reasons without collecting page text', () => {
  const ui = read('src/ui.js');
  assert.match(ui, /function renderActivitySummary/);
  assert.match(ui, /EXP\.Audit\.snapshot\(\)/);
  assert.match(ui, /data-exp-activity-summary/);
  assert.doesNotMatch(ui, /innerText|outerHTML/);
});

test('page intervention styles use the CSP-safe style service', () => {
  const styles = read('src/page-styles.js');
  const actions = read('src/actions.js');
  const layout = read('src/layout.js');
  assert.match(styles, /EXP\.Core\.injectStyle\(document, css, data\)/);
  assert.doesNotMatch(styles, /new CSSStyleSheet\(\)/);
  assert.match(actions, /EXP\.PageStyles\.inject/);
  assert.match(layout, /EXP\.PageStyles\.inject/);
  assert.doesNotMatch(actions, /createElement\('style'\)/);
  assert.doesNotMatch(layout, /createElement\('style'\)/);
});

test('Amazon fixture matrix covers every supported page family and dynamic widgets', () => {
  for (const name of ['home', 'search', 'product', 'cart', 'checkout', 'dynamic']) {
    const fixture = read(`tests-v3/fixtures/amazon/${name}.html`);
    assert.match(fixture, /data-expected-detectors=/);
  }
});

test('coupon automation reports status and supports explicit quarantine recovery', () => {
  const engine = read('src/engine.js');
  const ui = read('src/ui.js');
  assert.match(engine, /function resumeCoupons\(\)/);
  assert.match(engine, /couponStatus/);
  assert.match(ui, /Coupon status/);
  assert.match(ui, /Resume coupon clipping/);
});

test('Protection view exposes a non-color Amazon adapter health state', () => {
  const ui = read('src/ui.js');
  assert.match(ui, /Amazon adapter/);
  assert.match(ui, /data-exp-adapter-health/);
  assert.match(ui, /Healthy|Attention|Inactive/);
});
