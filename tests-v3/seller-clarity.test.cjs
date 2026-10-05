'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const moduleNames = ['core.js','settings.js','patterns.js','audit.js','retailers.js','amazon-adapter.js','walmart-adapter.js','ebay-adapter.js','etsy-adapter.js','activity.js','page-styles.js','actions.js','seller-clarity.js','layout.js','engine.js'];
const runtime = `${fs.readFileSync(path.join(root,'vendor/exp-core/exp-core.js'),'utf8')}\nconst EXP={};${moduleNames.map((name) => fs.readFileSync(path.join(root,'src',name),'utf8')).join('\n')}window.EXP=EXP;`;

// Markup mirrors the Amazon product page features Seller Clarity reads.
const histogram = (shares) => `<div id="cm_cr_dp_d_rating_histogram"><ul>${Object.entries(shares).map(([stars, share]) => `<li><a aria-label="${share} percent of reviews have ${stars} stars" href="#">${stars}</a></li>`).join('')}</ul></div>`;
const product = ({ brand, byline = `Visit the ${brand} Store`, seller, shipsFrom = 'Amazon', rating = '4.3 out of 5 stars', count = '1,204 ratings', shares = { 5: 52, 4: 20, 3: 12, 2: 6, 1: 10 } }) => `<!doctype html><html><body><div id="dp">
  <div id="title_feature_div"><h1 id="title">Wireless thing</h1></div>
  <div id="bylineInfo_feature_div"><a id="bylineInfo" href="/stores/x">${byline}</a></div>
  <span id="acrPopover" title="${rating}"><span>${rating}</span></span><span id="acrCustomerReviewText">${count}</span>
  <div id="productOverview_feature_div"><table><tr class="po-brand"><td class="a-span3">Brand</td><td class="a-span9"><span>${brand}</span></td></tr></table></div>
  <div id="buybox"><div offer-display-feature-name="desktop-fulfiller-info"><span class="offer-display-feature-text-message">${shipsFrom}</span></div>
  <div offer-display-feature-name="desktop-merchant-info"><span class="offer-display-feature-text-message">${seller}</span></div>
  <input id="add-to-cart-button" type="submit" value="Add to Cart"></div>
  ${histogram(shares)}
</div></body></html>`;
const card = (brand) => `<div data-component-type="s-search-result"><div data-cy="title-recipe"><h2 class="a-size-mini"><span class="a-size-base-plus a-color-base">${brand}</span></h2><h2><a href="/dp/x"><span>Item</span></a></h2></div></div>`;
const search = `<!doctype html><html><body><div class="s-main-slot">${['VTKHHJ', 'Anker', 'SCHWINN', 'QWZNDX'].map(card).join('')}</div></body></html>`;

async function open(browser, pathname, html) {
  const page = await browser.newPage();
  await page.route('https://www.amazon.com/**', (route) => (route.request().isNavigationRequest() ? route.fulfill({ status: 200, contentType: 'text/html', body: html }) : route.abort()));
  await page.goto(`https://www.amazon.com${pathname}`);
  await page.addScriptTag({ content: runtime });
  await page.evaluate(() => { EXP.Settings.load(); EXP.Engine.start(); });
  return page;
}
const note = (page) => page.evaluate(() => {
  const node = document.querySelector('[data-ward-owner="seller-clarity"].exp-ward-clarity');
  return node && {
    owned: node.dataset.expOwned, afterByline: node.previousElementSibling?.id, signals: [...node.querySelectorAll('[data-ward-signal]')].map((item) => item.dataset.wardSignal),
    text: node.textContent, trust: node.querySelector('button')?.textContent || null
  };
});

test('generated-style brand names are recognized conservatively', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await open(browser, '/s?k=x', search);
  const verdicts = await page.evaluate(() => Object.fromEntries(['VTKHHJ', 'QWZNDX', 'BTKKJ', 'XGODY', 'Anker', 'ANKER', 'SCHWINN', 'STRYKER', 'LG', 'NZXT', 'DEWALT', 'UGREEN', 'HP-X'].map((name) => [name, EXP.SellerClarity.generatedBrandName(name)])));
  assert.deepEqual(verdicts, { VTKHHJ: true, QWZNDX: true, BTKKJ: true, XGODY: false, Anker: false, ANKER: false, SCHWINN: false, STRYKER: false, LG: false, NZXT: false, DEWALT: false, UGREEN: false, 'HP-X': false });
});

test('a third-party listing with a generated brand and split ratings gets one note after the byline', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await open(browser, '/dp/B0TEST', product({ brand: 'VTKHHJ', seller: 'Shenzhen Bright Trading Co', shares: { 5: 61, 4: 6, 3: 4, 2: 4, 1: 25 } }));
  const result = await note(page);
  assert.equal(result.owned, '1');
  assert.equal(result.afterByline, 'bylineInfo_feature_div');
  assert.deepEqual(result.signals, ['seller.not-brand', 'brand.generated-name', 'ratings.polarized']);
  assert.match(result.text, /Brand: VTKHHJ · Sold by: Shenzhen Bright Trading Co · Ships from: Amazon/);
  assert.equal(result.trust, 'Trust VTKHHJ');
  // Rescans keep exactly one note and never touch store controls.
  const after = await page.evaluate(() => { EXP.Engine.processBatch([document]); EXP.Engine.processBatch([document]); return { notes: document.querySelectorAll('.exp-ward-clarity').length, cart: document.querySelector('#add-to-cart-button').isConnected, hidden: document.querySelectorAll('[data-ward-action]').length }; });
  assert.deepEqual(after, { notes: 1, cart: true, hidden: 0 });
});

test('brand-owned and Amazon-sold listings stay quiet unless the summary is always on', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const brandStore = await open(browser, '/dp/B0BRAND', product({ brand: 'Anker', seller: 'AnkerDirect' }));
  assert.equal(await note(brandStore), null);
  const amazon = await open(browser, '/dp/B0AMZN', product({ brand: 'Brita', byline: 'Brand: Brita', seller: 'Amazon.com' }));
  assert.equal(await note(amazon), null);
  await amazon.evaluate(() => EXP.Settings.update({ sellerClarityAlways: true }));
  await amazon.evaluate(() => EXP.Engine.rebuild());
  const summary = await note(amazon);
  assert.deepEqual(summary.signals, []);
  assert.match(summary.text, /Seller clarity.*Brand: Brita · Sold by: Amazon\.com/);
  assert.equal(summary.trust, null);
});

test('a very high score from few ratings is a hint on its own', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await open(browser, '/dp/B0THIN', product({ brand: 'Anker', seller: 'AnkerDirect', rating: '4.9 out of 5 stars', count: '11 ratings', shares: { 5: 91, 4: 9, 3: 0, 2: 0, 1: 0 } }));
  assert.deepEqual((await note(page)).signals, ['ratings.thin-high']);
});

test('trusting a brand is stored locally and removes its brand and seller hints', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await open(browser, '/dp/B0TEST', product({ brand: 'VTKHHJ', seller: 'Shenzhen Bright Trading Co', shares: { 5: 61, 4: 6, 3: 4, 2: 4, 1: 25 } }));
  await page.evaluate(() => {
    EXP.Settings.subscribe(() => EXP.Engine.rebuild());
    document.querySelector('.exp-ward-clarity button').click();
  });
  const result = await note(page);
  assert.deepEqual(result.signals, ['ratings.polarized']);
  assert.equal(result.trust, null);
  assert.deepEqual(await page.evaluate(() => EXP.Settings.snapshot().trustedBrands), ['vtkhhj']);
});

test('search results label only generated-style brands and the switch removes labels', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await open(browser, '/s?k=x', search);
  const labelled = () => page.evaluate(() => [...document.querySelectorAll('.exp-ward-clarity-chip')].map((chip) => chip.previousElementSibling.textContent));
  assert.deepEqual(await labelled(), ['VTKHHJ', 'QWZNDX']);
  await page.evaluate(() => { EXP.Engine.processBatch([document]); });
  assert.deepEqual(await labelled(), ['VTKHHJ', 'QWZNDX']);
  await page.evaluate(() => { EXP.Settings.update({ sellerClaritySearch: false }); EXP.Engine.rebuild(); });
  assert.deepEqual(await labelled(), []);
});

test('Safe Mode, the master switch, the feature switch and navigation all remove notes', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await open(browser, '/dp/B0TEST', product({ brand: 'VTKHHJ', seller: 'Other Seller' }));
  const count = () => page.evaluate(() => document.querySelectorAll('[data-ward-owner="seller-clarity"]').length);
  assert.equal(await count(), 1);
  for (const patch of [{ safeMode: true }, { enabled: false }, { sellerClarity: false }]) {
    await page.evaluate((value) => { EXP.Settings.update(value); EXP.Engine.rebuild(); }, patch);
    assert.equal(await count(), 0, JSON.stringify(patch));
    await page.evaluate(() => { EXP.Settings.update({ safeMode: false, enabled: true, sellerClarity: true }); EXP.Engine.rebuild(); });
    assert.equal(await count(), 1);
  }
  await page.evaluate(() => EXP.Engine.navigation());
  // A navigation rescans the same document, so the note comes back exactly once.
  assert.equal(await count(), 1);
  await page.evaluate(() => EXP.Engine.stop());
  assert.equal(await count(), 0);
});

test('diagnostics keep signal IDs and counts, never brand or seller text', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await open(browser, '/dp/B0TEST', product({ brand: 'VTKHHJ', seller: 'Shenzhen Bright Trading Co' }));
  const diagnostics = await page.evaluate(() => JSON.stringify(EXP.Engine.diagnostics().sellerClarity));
  assert.match(diagnostics, /brand\.generated-name/);
  assert.doesNotMatch(diagnostics, /VTKHHJ|Shenzhen|Amazon/);
});

test('trusted brands are validated, bounded, and survive export and import', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await open(browser, '/s?k=x', search);
  const result = await page.evaluate(() => {
    const valid = EXP.Settings.validate({ trustedBrands: ['vtkhhj', 'vtkhhj', 'Bad Value', 42, 'x'.repeat(61), 'anker'], sellerClarity: 'yes' });
    const many = EXP.Settings.validate({ trustedBrands: Array.from({ length: 250 }, (_, index) => `b${index}`) });
    EXP.Settings.update({ trustedBrands: ['vtkhhj'] });
    const imported = EXP.Settings.prepareImport(EXP.Settings.exportData());
    return { brands: valid.trustedBrands, enabled: valid.sellerClarity, many: many.trustedBrands.length, last: many.trustedBrands.at(-1), imported: imported.trustedBrands };
  });
  assert.deepEqual(result, { brands: ['vtkhhj', 'anker'], enabled: true, many: 200, last: 'b249', imported: ['vtkhhj'] });
});

test('Seller Clarity never clicks, navigates or sends data', () => {
  const source = fs.readFileSync(path.join(root, 'src/seller-clarity.js'), 'utf8');
  assert.doesNotMatch(source, /\.click\s*\(|location\s*=|location\.href|\.submit\s*\(|GM_xmlhttpRequest|fetch\s*\(|sendBeacon|innerHTML/);
  assert.match(fs.readFileSync(path.join(root, 'scripts/build.cjs'), 'utf8'), /'seller-clarity\.js'/);
});
