'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const moduleNames = [
  'core.js', 'settings.js', 'patterns.js', 'audit.js', 'retailers.js', 'amazon-adapter.js',
  'activity.js', 'page-styles.js', 'actions.js', 'layout.js', 'engine.js',
];
if (fs.existsSync(path.join(root, 'src', 'walmart-adapter.js'))) moduleNames.splice(moduleNames.indexOf('activity.js'), 0, 'walmart-adapter.js');
const runtime = `${fs.readFileSync(path.join(root, 'vendor/exp-core/exp-core.js'), 'utf8')}\nconst EXP={};${moduleNames.map((name) => fs.readFileSync(path.join(root, 'src', name), 'utf8')).join('\n')}\nwindow.EXP=EXP;`;

async function pageAt(browser, url) {
  const page = await browser.newPage();
  await page.route('**/*', (route) => (route.request().isNavigationRequest()
    ? route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html><body><main>Store fixture</main></body></html>' })
    : route.abort()));
  await page.goto(url);
  await page.addScriptTag({ content: runtime });
  await page.evaluate(() => EXP.Settings.load());
  return page;
}

test('on Amazon the current retailer is Amazon and both switches gate protection', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await pageAt(browser, 'https://www.amazon.com/dp/test');
  const facts = await page.evaluate(() => {
    const settings = EXP.Settings.snapshot();
    return {
      key: EXP.Retailer.key(),
      label: EXP.Retailer.label(),
      features: EXP.Retailer.features(),
      patternCount: EXP.Retailer.patternIds().size,
      hasScarcity: EXP.Retailer.patternIds().has('pressure.scarcity'),
      enabled: EXP.Retailer.enabled(settings),
      storeOff: EXP.Retailer.enabled({ ...settings, retailers: { ...settings.retailers, amazon: false } }),
      otherStoreOff: EXP.Retailer.enabled({ ...settings, retailers: { ...settings.retailers, walmart: false } }),
      masterOff: EXP.Retailer.enabled({ ...settings, enabled: false }),
      keys: EXP.Retailers.keys(),
    };
  });
  assert.equal(facts.key, 'amazon');
  assert.equal(facts.label, 'Amazon');
  assert.deepEqual(facts.features, { coupons: true, compactSearch: true, recommendationCleanup: true });
  assert.equal(facts.patternCount, 11);
  assert.equal(facts.hasScarcity, true);
  assert.equal(facts.enabled, true);
  assert.equal(facts.storeOff, false);
  assert.equal(facts.otherStoreOff, true);
  assert.equal(facts.masterOff, false);
  assert.ok(facts.keys.includes('amazon'));
});

test('on a site no adapter supports, the retailer answers safely and protection stays off', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await pageAt(browser, 'https://unsupported.example/');
  const facts = await page.evaluate(() => ({
    key: EXP.Retailer.key(),
    label: EXP.Retailer.label(),
    eligible: EXP.Retailer.eligible(),
    enabled: EXP.Retailer.enabled(EXP.Settings.snapshot()),
    classify: EXP.Retailer.classify(),
    detect: EXP.Retailer.detect([document]),
    coupons: EXP.Retailer.couponCandidates([document]),
    coupon: EXP.Retailer.verifyCouponTarget(document.body),
    diagnose: EXP.Retailer.diagnose(),
    features: EXP.Retailer.features(),
  }));
  assert.equal(facts.key, 'none');
  assert.equal(facts.label, 'Store');
  assert.equal(facts.eligible, false);
  assert.equal(facts.enabled, false);
  assert.equal(facts.classify, 'other');
  assert.deepEqual(facts.detect, []);
  assert.deepEqual(facts.coupons, []);
  assert.equal(facts.coupon.eligible, false);
  assert.equal(facts.diagnose.pageType, 'unsupported');
  assert.deepEqual(facts.features, {});
});

test('the registry validates adapters, refuses duplicates, and picks the one that claims the page', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await pageAt(browser, 'https://shop.example/item');
  const facts = await page.evaluate(() => {
    const adapter = (key, claims) => ({
      key, label: key.toUpperCase(), features: {}, patternIds: [],
      eligible: () => claims, classify: () => 'product', detect: () => [], structuralSafety: () => ({ safe: true }),
      diagnose: () => ({ id: key, health: 'healthy', eligible: claims, pageType: 'product' }), nextEpoch: () => 1, cleanup: () => {},
    });
    const attempt = (fn) => { try { fn(); return 'ok'; } catch (error) { return error.code; } };
    const results = {
      badKey: attempt(() => EXP.Retailers.register({ ...adapter('x', false), key: 'Bad Key' })),
      missing: attempt(() => EXP.Retailers.register({ key: 'incomplete', eligible: () => false })),
    };
    EXP.Retailers.register(adapter('quiet', false));
    EXP.Retailers.register(adapter('loud', true));
    results.duplicate = attempt(() => EXP.Retailers.register(adapter('quiet', false)));
    results.current = EXP.Retailers.current()?.key;
    results.viaProxy = EXP.Retailer.key();
    results.diagnose = EXP.Retailer.diagnose().id;
    return results;
  });
  assert.deepEqual(facts, { badKey: 'RETAILER_KEY', missing: 'RETAILER_INTERFACE', duplicate: 'RETAILER_DUPLICATE', current: 'loud', viaProxy: 'loud', diagnose: 'loud' });
});

test('settings keep one switch per store and migrate the old Amazon switch', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await pageAt(browser, 'https://www.amazon.com/');
  const facts = await page.evaluate(() => {
    const strip = (settings) => JSON.parse(JSON.stringify(settings.retailers));
    const legacyOff = EXP.Settings.validate({ amazonEnabled: false });
    const explicit = EXP.Settings.validate({ amazonEnabled: false, retailers: { amazon: true, walmart: false } });
    const junk = EXP.Settings.validate({ retailers: { amazon: 'nope', walmart: 1, unknown: false } });
    const exported = EXP.Settings.exportData().settings;
    return {
      defaults: strip(EXP.Settings.validate({})),
      legacyOff: strip(legacyOff),
      legacyKeyGone: 'amazonEnabled' in legacyOff,
      explicit: strip(explicit),
      junk: strip(junk),
      exportedKeyGone: 'amazonEnabled' in exported,
    };
  });
  assert.deepEqual(facts.defaults, { amazon: true, walmart: true, ebay: true, etsy: true, target:true, bestbuy:true });
  assert.deepEqual(facts.legacyOff, { amazon: false, walmart: true, ebay: true, etsy: true, target:true, bestbuy:true });
  assert.equal(facts.legacyKeyGone, false);
  assert.deepEqual(facts.explicit, { amazon: true, walmart: false, ebay: true, etsy: true, target:true, bestbuy:true }, 'a store switch beats the legacy value');
  assert.deepEqual(facts.junk, { amazon: true, walmart: true, ebay: true, etsy: true, target:true, bestbuy:true });
  assert.equal(facts.exportedKeyGone, false);
});
