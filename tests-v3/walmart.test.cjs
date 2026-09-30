'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const moduleNames = ['core.js', 'settings.js', 'patterns.js', 'audit.js', 'retailers.js', 'amazon-adapter.js', 'walmart-adapter.js', 'activity.js', 'page-styles.js', 'actions.js', 'layout.js', 'engine.js'];
const runtime = `${fs.readFileSync(path.join(root, 'vendor/exp-core/exp-core.js'), 'utf8')}\nconst EXP={};${moduleNames.map((name) => fs.readFileSync(path.join(root, 'src', name), 'utf8')).join('\n')}\nwindow.EXP=EXP;`;

// Markup mirrors what walmart.com served for a search results page: hashed classes,
// stable data-testid hooks, badges that share one testid and differ only in wording.
const tile = (badges, price = '') => `<div role="group" data-item-id="X1"><a href="/ip/Thing/1"><h3>Thing</h3></a>
  <div data-testid="ugpp-main-price"><span>$19.00</span>${price}</div>
  ${badges.map((text) => `<span data-testid="badgeTagComponent"><span>${text}</span></span>`).join('')}
  <button data-testid="add-to-cart-button">Add</button></div>`;
const searchHtml = `<!doctype html><html><body><div data-testid="layout-container"><main data-testid="maincontent">
  <div data-testid="skyline-ad"><img alt=""></div>
  <div data-testid="item-stack">${tile(['100+ bought since yesterday', 'Low stock', 'Save with', 'Best seller'], '<span data-testid="ugpp-was-price">$29.00</span>')}${tile(["In 1K+ people's carts", 'Deal', 'Free shipping, arrives tomorrow'])}</div>
</main></div></body></html>`;

async function open(browser, url, html) {
  const page = await browser.newPage();
  await page.route('**/*', (route) => (route.request().isNavigationRequest() ? route.fulfill({ status: 200, contentType: 'text/html', body: html }) : route.abort()));
  await page.goto(url);
  await page.addScriptTag({ content: runtime });
  await page.evaluate(() => EXP.Settings.load());
  return page;
}

test('Walmart is recognised and its page types classify', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await open(browser, 'https://www.walmart.com/search?q=x', searchHtml);
  const facts = await page.evaluate(() => ({
    key: EXP.Retailer.key(), label: EXP.Retailer.label(), features: EXP.Retailer.features(),
    kinds: ['/ip/a/1', '/search', '/browse/x', '/cart', '/checkout', '/', '/orders', '/other'].map((p) => EXP.WalmartAdapter.classify(p)),
    patterns: [...EXP.Retailer.patternIds()].sort(),
  }));
  assert.equal(facts.key, 'walmart');
  assert.equal(facts.label, 'Walmart');
  assert.deepEqual(facts.features, { coupons: false, compactSearch: false, recommendationCleanup: false });
  assert.deepEqual(facts.kinds, ['product', 'search', 'search', 'cart', 'checkout', 'home', 'orders', 'other']);
  assert.deepEqual(facts.patterns, ['pressure.scarcity', 'pressure.social-proof', 'pressure.urgency', 'pricing.reference-price', 'sponsorship.placement', 'upsell.financial-product', 'upsell.protection-plan', 'upsell.store-membership']);
});

test('badges are told apart by wording and price/cart controls are never targeted', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await open(browser, 'https://www.walmart.com/search?q=x', searchHtml);
  const found = await page.evaluate(() => EXP.Retailer.detect([document]).map((e) => ({ pattern: e.patternId, text: e.node.textContent.trim().slice(0, 40), safe: e.structuralSafe, tag: e.node.getAttribute('data-testid') })));
  const byPattern = (id) => found.filter((item) => item.pattern === id).map((item) => item.text);
  assert.deepEqual(byPattern('pressure.social-proof'), ['100+ bought since yesterday', "In 1K+ people's carts"]);
  assert.deepEqual(byPattern('pressure.scarcity'), ['Low stock']);
  assert.deepEqual(byPattern('pressure.urgency'), ['Deal']);
  assert.deepEqual(byPattern('upsell.store-membership'), ['Save with']);
  assert.equal(byPattern('pricing.reference-price').length, 1);
  assert.equal(byPattern('sponsorship.placement').length, 1);
  // Informational badges are left alone.
  const texts = found.map((item) => item.text).join('|');
  assert.doesNotMatch(texts, /Best seller|Free shipping/);
  assert.ok(found.every((item) => item.tag !== 'add-to-cart-button' && item.tag !== 'ugpp-main-price'));
  assert.ok(found.filter((item) => item.tag === 'badgeTagComponent').every((item) => item.safe));
});

test('the reference price is annotated, never hidden, and stays in place', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await open(browser, 'https://www.walmart.com/search?q=x', searchHtml);
  const facts = await page.evaluate(() => {
    const pattern = EXP.Patterns.get('pricing.reference-price');
    return { actions: pattern.allowedActions, defaultAction: pattern.defaultAction, label: pattern.label };
  });
  assert.deepEqual(facts.actions, ['annotate', 'allow']);
  assert.equal(facts.defaultAction, 'annotate');
  assert.match(facts.label, /not verified/i);
});

test('the Walmart switch turns protection off there without touching Amazon', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await open(browser, 'https://www.walmart.com/search?q=x', searchHtml);
  const facts = await page.evaluate(() => {
    const settings = EXP.Settings.snapshot();
    return {
      on: EXP.Retailer.enabled(settings),
      walmartOff: EXP.Retailer.enabled({ ...settings, retailers: { ...settings.retailers, walmart: false } }),
      amazonOff: EXP.Retailer.enabled({ ...settings, retailers: { ...settings.retailers, amazon: false } }),
    };
  });
  assert.deepEqual(facts, { on: true, walmartOff: false, amazonOff: true });
});

// Product and cart pages, from walmart.com item and cart markup.
const productHtml = `<!doctype html><html><body><div data-testid="layout-container"><main data-testid="maincontent">
  <div data-testid="ItemPageBadgeModule2"><span data-testid="badgeTagComponent"><span>100+ bought since yesterday</span></span><span data-testid="badgeTagComponent"><span>Best seller</span></span></div>
  <div data-testid="price-wrap"><span data-testid="ugpp-main-price">$199</span><span data-testid="ugpp-was-price">$249</span></div>
  <div data-testid="add-to-cart-section"><button data-testid="add-to-cart-button" type="button">Add to cart</button></div>
  <div data-testid="item-addon-services-new"><section data-testid="CAREPLAN_SERVICE">Walmart Accident Plan by Allstate<button type="button">What's covered</button><input type="radio"><input type="radio"></section></div>
  <div data-testid="brand-box-ad"><div data-testid="brandbox-ad"></div></div>
  <div data-testid="oneDebitCardBannerLink"><img alt=""></div>
  <div data-testid="save-with-walmart-plus-badge">Save with Walmart+</div>
</main></div></body></html>`;

test('product pages: plan, card banner, brand ad and Walmart+ badge are found; purchase controls are not', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await open(browser, 'https://www.walmart.com/ip/Thing/1', productHtml);
  const found = await page.evaluate(() => EXP.Retailer.detect([document]).map((e) => ({ pattern: e.patternId, tag: e.node.getAttribute('data-testid'), safe: e.structuralSafe })));
  const tagsFor = (id) => found.filter((item) => item.pattern === id).map((item) => item.tag);
  assert.deepEqual(tagsFor('upsell.protection-plan'), ['item-addon-services-new']);
  assert.deepEqual(tagsFor('upsell.financial-product'), ['oneDebitCardBannerLink']);
  assert.deepEqual(tagsFor('sponsorship.placement'), ['brand-box-ad']);
  assert.deepEqual(tagsFor('upsell.store-membership'), ['save-with-walmart-plus-badge']);
  assert.deepEqual(tagsFor('pricing.reference-price'), ['ugpp-was-price']);
  assert.ok(found.filter((item) => item.pattern !== 'pricing.reference-price').every((item) => item.safe), 'every removable target is a complete, self-contained unit');
  assert.ok(found.every((item) => !['add-to-cart-section', 'add-to-cart-button', 'ugpp-main-price', 'price-wrap'].includes(item.tag)));
});
