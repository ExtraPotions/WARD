'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const moduleNames = ['core.js', 'settings.js', 'patterns.js', 'audit.js', 'retailers.js', 'amazon-adapter.js', 'walmart-adapter.js', 'ebay-adapter.js', 'etsy-adapter.js', 'activity.js', 'page-styles.js', 'actions.js', 'layout.js', 'engine.js'];
const runtime = `${fs.readFileSync(path.join(root, 'vendor/exp-core/exp-core.js'), 'utf8')}\nconst EXP={};${moduleNames.map((name) => fs.readFileSync(path.join(root, 'src', name), 'utf8')).join('\n')}\nwindow.EXP=EXP;`;

async function open(browser, url, html) {
  const page = await browser.newPage();
  await page.route('**/*', (route) => (route.request().isNavigationRequest() ? route.fulfill({ status: 200, contentType: 'text/html', body: html }) : route.abort()));
  await page.goto(url);
  await page.addScriptTag({ content: runtime });
  await page.evaluate(() => EXP.Settings.load());
  return page;
}

// Markup mirrors etsy.com: grid cells holding v2-listing-card units, ad captions
// inside the card, and data-appears-component-name section hooks on listing pages.
const cell = (caption, price = '') => `<li class="wt-block-grid__item"><div class="js-merch-stash-check-listing v2-listing-card" data-listing-id="1"><a class="listing-link" href="/listing/1/x"><div class="v2-listing-card__info"><p class="wt-text-caption"><span>${caption}</span></p>${price}</div></a></div></li>`;
const cell2 = (caption) => `<li class="wt-list-unstyled"><div class="wt-height-full"><div class="js-merch-stash-check-listing v2-listing-card" data-listing-id="2"><a class="listing-link" href="/listing/2/y"><div class="v2-listing-card__info"><p class="wt-text-caption"><span>${caption}</span></p></div></a></div></div></li>`;
const searchHtml = `<!doctype html><html><head><meta charset="utf-8"></head><body><main><ul class="wt-block-grid">
  ${cell('Ad by Etsy seller', '<p class="wt-text-caption"><span class="wt-text-strikethrough">$21.50</span> (20% off)</p>')}
  ${cell('Ad・By VivaWorkshop')}
  ${cell('By EmilyEmberleaf')}
  ${cell2('Ad by Etsy seller')}
  ${cell2('By QuietShop')}
</ul></main></body></html>`;
const listingHtml = `<!doctype html><html><head><meta charset="utf-8"></head><body><main>
  <div data-appears-component-name="Etsy-Modules-ListingPage-UrgencySignal-RecsRankingApiSpec">In 20+ carts</div>
  <div data-appears-component-name="price">Price: $40.00+ <span class="wt-text-strikethrough">$50.00</span></div>
  <div data-appears-component-name="klarna_osm_messaging"><img alt=""></div>
  <div data-appears-component-name="add_to_cart_form"><button type="submit">Add to cart</button></div>
  <div data-appears-component-name="express_checkout_button"><button>Buy it now</button></div>
  <div data-appears-component-name="did_you_know"><button>Did you know?</button></div>
</main></body></html>`;

test('Etsy is recognised and page types classify', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await open(browser, 'https://www.etsy.com/search?q=x', searchHtml);
  const facts = await page.evaluate(() => ({ key: EXP.Retailer.key(), label: EXP.Retailer.label(), kinds: ['/listing/1/x', '/uk/listing/1/x', '/search', '/c/home', '/cart', '/', '/help'].map((p) => EXP.EtsyAdapter.classify(p)), patterns: [...EXP.Retailer.patternIds()].sort() }));
  assert.equal(facts.key, 'etsy');
  assert.equal(facts.label, 'Etsy');
  assert.deepEqual(facts.kinds, ['product', 'product', 'search', 'search', 'cart', 'home', 'other']);
  assert.deepEqual(facts.patterns, ['pressure.scarcity', 'pressure.social-proof', 'pricing.reference-price', 'sponsorship.placement', 'upsell.financial-product']);
});

test('search: ad listings hide as whole grid cells, organic ones stay, struck prices are annotated', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await open(browser, 'https://www.etsy.com/search?q=x', searchHtml);
  const found = await page.evaluate(() => EXP.Retailer.detect([document]).map((e) => ({ pattern: e.patternId, tag: e.node.tagName, cls: e.node.className, safe: e.structuralSafe, text: e.node.textContent.trim().slice(0, 20) })));
  const ads = found.filter((item) => item.pattern === 'sponsorship.placement');
  assert.equal(ads.length, 3);
  assert.ok(ads.every((item) => item.tag === 'LI' && item.safe));
  assert.ok(ads.every((item) => !/EmilyEmberleaf|QuietShop/.test(item.text)));
  const refs = found.filter((item) => item.pattern === 'pricing.reference-price');
  assert.equal(refs.length, 1);
  assert.equal(refs[0].text, '$21.50');
});

test('listing page: cart signal, financing message and struck price found; purchase controls are not', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await open(browser, 'https://www.etsy.com/listing/1/x', listingHtml);
  const found = await page.evaluate(() => EXP.Retailer.detect([document]).map((e) => ({ pattern: e.patternId, text: e.node.textContent.trim().slice(0, 30), safe: e.structuralSafe })));
  assert.deepEqual(found.map((item) => item.pattern).sort(), ['pressure.social-proof', 'pricing.reference-price', 'upsell.financial-product']);
  assert.ok(found.every((item) => !/Add to cart|Buy it now|Did you know/.test(item.text)));
});

test('the Etsy switch turns protection off there without touching other stores', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await open(browser, 'https://www.etsy.com/listing/1/x', listingHtml);
  const facts = await page.evaluate(() => { const s = EXP.Settings.snapshot(); return { on: EXP.Retailer.enabled(s), etsyOff: EXP.Retailer.enabled({ ...s, retailers: { ...s.retailers, etsy: false } }), ebayOff: EXP.Retailer.enabled({ ...s, retailers: { ...s.retailers, ebay: false } }) }; });
  assert.deepEqual(facts, { on: true, etsyOff: false, ebayOff: true });
});
