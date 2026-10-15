'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const distribution = fs.readFileSync(path.join(root, 'ward.user.js'), 'utf8');
const files = ['core.js', 'settings.js', 'patterns.js', 'audit.js', 'retailers.js', 'amazon-adapter.js', 'walmart-adapter.js', 'ebay-adapter.js', 'etsy-adapter.js', 'activity.js', 'page-styles.js', 'actions.js', 'layout.js', 'engine.js'];
const runtime = `${fs.readFileSync(path.join(root, 'vendor/exp-core/exp-core.js'), 'utf8')}\nconst EXP={};${files.map((name) => fs.readFileSync(path.join(root, 'src', name), 'utf8')).join('\n')}window.EXP=EXP;`;
const body = '<main><h1>Product</h1><div data-component-type="s-sponsored-result" id="ad">Sponsored</div><div id="buybox"><button>Buy</button></div></main>';

async function amazonPage(browser) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('https://www.amazon.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: `<!doctype html><html><body>${body}</body></html>` }));
  await page.goto('https://www.amazon.com/dp/fixture');
  return { page, errors };
}

const presentation = (page) => page.locator('#ad').evaluate((node) => JSON.parse(node.getAttribute('data-exp-presentation-state') || '{}'));

test('shipped WARD bundle publishes hide state for other products and never exposes Core globally', async (t) => {
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  const { page, errors } = await amazonPage(browser);
  await page.evaluate(() => { const values = new Map(); window.GM_getValue = (key, fallback) => values.has(key) ? values.get(key) : fallback; window.GM_setValue = (key, value) => values.set(key, value); window.GM_xmlhttpRequest = () => {}; });
  await page.addScriptTag({ content: distribution });
  await page.waitForFunction(() => document.querySelector('#ad')?.hidden === true);
  assert.deepEqual(await presentation(page), { ward: { visibility: 'hide' } });
  await page.waitForFunction(() => document.querySelector('meta[data-exp-suite-state-product="ward"]'));
  const suiteState = await page.evaluate(() => JSON.parse(document.querySelector('meta[data-exp-suite-state-product="ward"]').dataset.expSuiteStatePayload));
  assert.equal(suiteState.hide, 1);
  assert.equal(await page.evaluate(() => typeof globalThis.ExtraPotionsCore), 'undefined');
  assert.deepEqual(errors, []);
});

test('WARD clears its presentation state when protection is lifted', async (t) => {
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  const { page, errors } = await amazonPage(browser);
  await page.addScriptTag({ content: runtime });
  await page.evaluate(() => { EXP.Settings.load(); EXP.Settings.update({ autoClipCoupons: false }); EXP.Engine.start(); });
  assert.deepEqual(await presentation(page), { ward: { visibility: 'hide' } });
  await page.evaluate(() => { EXP.Settings.update({ pageExceptions: [{ path: 'www.amazon.com/dp/fixture', patternId: 'sponsorship.placement' }] }); EXP.Engine.rebuild(); });
  assert.equal(await page.locator('#ad').evaluate((node) => node.hidden), false);
  assert.equal(await page.locator('#ad').evaluate((node) => node.hasAttribute('data-exp-presentation-state')), false);
  assert.deepEqual(errors, []);
});
