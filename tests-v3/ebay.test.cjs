'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const moduleNames = ['core.js', 'settings.js', 'patterns.js', 'audit.js', 'retailers.js', 'amazon-adapter.js', 'walmart-adapter.js', 'ebay-adapter.js','etsy-adapter.js', 'activity.js', 'page-styles.js', 'actions.js', 'layout.js', 'engine.js'];
const runtime = `${fs.readFileSync(path.join(root, 'vendor/exp-core/exp-core.js'), 'utf8')}\nconst EXP={};${moduleNames.map((name) => fs.readFileSync(path.join(root, 'src', name), 'utf8')).join('\n')}\nwindow.EXP=EXP;`;

async function open(browser, url, html) {
  const page = await browser.newPage();
  await page.route('**/*', (route) => (route.request().isNavigationRequest() ? route.fulfill({ status: 200, contentType: 'text/html', body: html }) : route.abort()));
  await page.goto(url);
  await page.addScriptTag({ content: runtime });
  await page.evaluate(() => EXP.Settings.load());
  return page;
}

const row = (...texts) => `<div class="s-card__attribute-row">${texts.map((text) => `<span class="su-styled-text primary">${text}</span>`).join('')}</div>`;
const card = (rows, label = '') => `<li class="s-card s-card--horizontal"><a href="/itm/1"><span class="s-card__title">Thing</span></a>${label}${rows}</li>`;
// Markup mirrors ebay.com search: readable class names, badges as plain text spans.
const searchHtml = `<!doctype html><html><body><div hidden><div id="s-a">Sponsored</div><div id="s-b"></div></div><main id="mainContent"><div class="srp-main"><div class="srp-river"><ul class="srp-results">
  ${card(row('161 sold') + row('35 watchers') + row('Free delivery') + row('Save up to 20% when you buy more') + row('Last one'))}
  ${card(row('Brand New'), '<div class="s-card__footer"><b role="heading" aria-labelledby="s-a s-b"></b></div>')}
  ${card(row('Free returns'))}
  <li class="srp-river-answer srp-river-answer--ITEMS_CAROUSEL_WITH_COLOR"><h2>Picked For You</h2><a href="/itm/2">x</a><button aria-label="Next">next</button></li>
  <li class="srp-river-answer srp-river-answer--BASIC_PAGINATION_V2"><a href="?_pgn=2">2</a></li>
</ul></div></div></main></body></html>`;
const itemHtml = `<!doctype html><html><body><main id="mainContent"><div id="CenterPanel">
  <div class="ux-image-carousel-buttons"><div class="x-ebay-signal"><span class="signal"><span class="ux-textspans">In 136 carts</span></span></div></div>
  <div class="x-quantity__availability" id="qtyAvailability"><span class="ux-textspans">Only 2 available</span><span class="ux-textspans">619 sold</span></div>
  <div class="x-bin-action"><a id="binBtn_btn" href="#"><span>Buy It Now</span></a><a id="isCartBtn_btn" href="#">Add to cart</a></div>
</div></main></body></html>`;

test('eBay is recognised and page types classify', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await open(browser, 'https://www.ebay.com/sch/i.html?_nkw=x', searchHtml);
  const facts = await page.evaluate(() => ({ key: EXP.Retailer.key(), label: EXP.Retailer.label(), kinds: ['/itm/1', '/sch/i.html', '/b/x/1', '/cart', '/', '/mye/x', '/help'].map((p) => EXP.EbayAdapter.classify(p)), patterns: [...EXP.Retailer.patternIds()].sort() }));
  assert.equal(facts.key, 'ebay');
  assert.equal(facts.label, 'eBay');
  assert.deepEqual(facts.kinds, ['product', 'search', 'search', 'cart', 'home', 'orders', 'other']);
  assert.deepEqual(facts.patterns, ['cross-sell.recommendation', 'pressure.scarcity', 'pressure.social-proof', 'sponsorship.placement']);
});

test('search results: popularity, scarcity, recommendation module and sponsored cards are found; facts and pagination are not', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await open(browser, 'https://www.ebay.com/sch/i.html?_nkw=x', searchHtml);
  const found = await page.evaluate(() => EXP.Retailer.detect([document]).map((e) => ({ pattern: e.patternId, text: e.node.textContent.trim().slice(0, 24), tag: e.node.tagName, safe: e.structuralSafe })));
  const of = (id) => found.filter((item) => item.pattern === id).map((item) => item.text);
  assert.deepEqual(of('pressure.social-proof'), ['161 sold', '35 watchers']);
  assert.deepEqual(of('pressure.scarcity'), ['Last one']);
  assert.equal(of('cross-sell.recommendation').length, 1);
  assert.equal(of('sponsorship.placement').length, 1);
  const texts = found.filter((item) => item.pattern.startsWith('pressure.')).map((item) => item.text).join('|');
  assert.doesNotMatch(texts, /Free delivery|Free returns|Brand New|Save up to/);
  assert.ok(found.every((item) => item.safe));
});

test('item page: cart signal, low stock and sold count are found; buy controls are not', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await open(browser, 'https://www.ebay.com/itm/1', itemHtml);
  const found = await page.evaluate(() => EXP.Retailer.detect([document]).map((e) => ({ pattern: e.patternId, text: e.node.textContent.trim() })));
  assert.deepEqual(found.filter((item) => item.pattern === 'pressure.social-proof').map((item) => item.text).sort(), ['619 sold', 'In 136 carts']);
  assert.deepEqual(found.filter((item) => item.pattern === 'pressure.scarcity').map((item) => item.text), ['Only 2 available']);
  assert.ok(found.every((item) => !/Buy It Now|Add to cart/.test(item.text)));
});

test('the eBay switch turns protection off there without touching other stores', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await open(browser, 'https://www.ebay.com/itm/1', itemHtml);
  const facts = await page.evaluate(() => { const s = EXP.Settings.snapshot(); return { on: EXP.Retailer.enabled(s), ebayOff: EXP.Retailer.enabled({ ...s, retailers: { ...s.retailers, ebay: false } }), amazonOff: EXP.Retailer.enabled({ ...s, retailers: { ...s.retailers, amazon: false } }) }; });
  assert.deepEqual(facts, { on: true, ebayOff: false, amazonOff: true });
});

// Cart, from a signed-in cart.ebay.com page: the bucket holds the shopper's item, and
// "These are for you" is a headed section wrapping a carousel of other listings.
const cartHtml = `<!doctype html><html><head><meta charset="utf-8"></head><body><main id="mainContent"><h1>Cart</h1>
  <div data-test-id="app-cart"><div data-test-id="cart-bucket"><h3>Item</h3><button data-test-id="cart-remove-item">Remove</button><a href="/pay">Go to checkout</a></div></div>
  <section><div><h2>These are for you</h2></div><div class="carousel"><ul><li><section><h3>Phone case</h3><span>50 sold</span></section></li></ul></div></section>
</main></body></html>`;

test('cart.ebay.com: the recommendation carousel is found; the item bucket and checkout are not', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await open(browser, 'https://cart.ebay.com/', cartHtml);
  const facts = await page.evaluate(() => ({ key: EXP.Retailer.key(), kind: EXP.EbayAdapter.classify('/'), found: EXP.Retailer.detect([document]).map((e) => ({ pattern: e.patternId, tag: e.node.tagName, safe: e.structuralSafe, text: e.node.textContent.slice(0, 20) })) }));
  assert.equal(facts.key, 'ebay');
  assert.equal(facts.kind, 'cart');
  assert.equal(facts.found.length, 1);
  assert.equal(facts.found[0].pattern, 'cross-sell.recommendation');
  assert.equal(facts.found[0].tag, 'SECTION');
  assert.equal(facts.found[0].safe, true);
  assert.doesNotMatch(facts.found[0].text, /Item|checkout/);
});
