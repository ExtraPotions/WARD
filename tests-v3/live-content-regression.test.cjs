'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const modules = ['core.js', 'settings.js', 'patterns.js', 'audit.js', 'retailers.js', 'amazon-adapter.js', 'activity.js', 'page-styles.js', 'site-theme.js', 'actions.js', 'layout.js', 'engine.js'];
const runtime = `${fs.readFileSync(path.join(root, 'vendor/exp-core/exp-core.js'), 'utf8')}\nvar EXP={};${modules.map(name => fs.readFileSync(path.join(root, 'src', name), 'utf8')).join('\n')}`;
async function setup(t, settings = {}) {
  const browser = await chromium.launch(); t.after(() => browser.close());
  const page = await browser.newPage();
  await page.route('**/*', route => route.request().isNavigationRequest() ? route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body><div id="result" class="s-result-item s-asin AdHolder" data-component-type="s-search-result"><span class="puis-sponsored-label-text">Sponsored</span><h2>Product</h2></div><div id="other" class="s-result-item s-asin AdHolder" data-component-type="s-search-result"><span class="puis-sponsored-label-text">Sponsored</span><h2>Other product</h2></div></body></html>' }) : route.abort());
  await page.goto('https://www.amazon.com/s?k=test');
  await page.addScriptTag({ content: runtime });
  await page.evaluate(settings => { window.GM_getValue = (key, fallback) => key === 'exp:v3:ward:settings' ? { autoClipCoupons: false, updateNotifications: false, ...settings } : fallback; window.GM_setValue = () => {}; EXP.UI = { init() {}, refresh() {}, refreshActivity() {}, restack() {}, cleanup() {} }; }, settings);
  return page;
}

for (const initial of [{ enabled: false }, { retailers: { amazon: false } }]) test(`protection starts when re-enabled after loading ${JSON.stringify(initial)}`, async t => {
  const page = await setup(t, initial);
  await page.addScriptTag({ content: fs.readFileSync(path.join(root, 'src/main.js'), 'utf8') });
  await page.waitForFunction(() => EXP.App.lifecycle.state === 'enabled');
  assert.equal(await page.evaluate(() => EXP.Engine.active), false);
  await page.evaluate(() => EXP.Settings.update({ enabled: true, retailers: { amazon: true } }));
  assert.equal(await page.evaluate(() => EXP.Engine.active), true);
  assert.equal(await page.locator('#result').evaluate(n => n.hidden), true);
  await page.evaluate(async () => { ExtraPotionsCore.setSuiteSitePaused(true); await new Promise(r => setTimeout(r, 20)); EXP.Settings.update({ enabled: true }); });
  assert.equal(await page.evaluate(() => EXP.Engine.active), false);
});

test('recycled results restore without clearing interventions outside the scanned subtree', async t => {
  const page = await setup(t);
  const result = await page.evaluate(() => {
    EXP.Settings.load(); EXP.Engine.start();
    const node = document.querySelector('#result');
    const initial = node.hidden;
    node.classList.remove('AdHolder'); node.innerHTML = '<h2>Organic replacement</h2>';
    EXP.Engine.processBatch([node.querySelector('h2')]);
    return { initial, hidden: node.hidden, tracked: node.hasAttribute('data-ward-instance'), otherHidden: document.querySelector('#other').hidden };
  });
  assert.deepEqual(result, { initial: true, hidden: false, tracked: false, otherHidden: true });
});
