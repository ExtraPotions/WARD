'use strict';
// Cases from the 2026-10 browser review of Amazon (Logitech G413 SE, B08Z6X4NK3).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const moduleNames = ['core.js','settings.js','patterns.js','audit.js','retailers.js','amazon-adapter.js','walmart-adapter.js','ebay-adapter.js','etsy-adapter.js','activity.js','page-styles.js','actions.js','layout.js','engine.js'];
const runtime = `${fs.readFileSync(path.join(root,'vendor/exp-core/exp-core.js'),'utf8')}\nconst EXP={};${moduleNames.map((name) => fs.readFileSync(path.join(root,'src',name),'utf8')).join('\n')}window.EXP=EXP;`;
async function amazonPage(t, body) {
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  const page = await browser.newPage();
  await page.route('https://www.amazon.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: `<!doctype html><html><body>${body}</body></html>` }));
  await page.goto('https://www.amazon.com/dp/B08Z6X4NK3');
  await page.addScriptTag({ content: runtime });
  await page.evaluate(() => EXP.Settings.load());
  return page;
}
const urgency = (page) => page.evaluate(() => EXP.AmazonAdapter.detect([document]).filter(({ patternId }) => patternId === 'pressure.urgency').map(({ node }) => node.id));

test('an empty deal-progress placeholder is not reported as an urgency message', async (t) => {
  const page = await amazonPage(t, '<div id="corePrice_feature_div">$49.99</div><div id="dealProgress_feature_div">\n   \n</div><div id="deliveryBlockMessage">FREE delivery</div>');
  assert.deepEqual(await urgency(page), []);
});

test('a deal-progress box that shows a message is still reported', async (t) => {
  const page = await amazonPage(t, '<div id="dealProgress_feature_div"><span>23% claimed</span></div>');
  assert.deepEqual(await urgency(page), ['dealProgress_feature_div']);
});

test('prune keeps an urgency label when the message target has its own non-empty aria-label', async (t) => {
  const page = await amazonPage(t, '<div id="dealProgress_feature_div" aria-label="  Only 2 left  " style="width:120px;height:20px"></div>');
  const result = await page.evaluate(() => {
    const node = document.getElementById('dealProgress_feature_div');
    EXP.Actions.apply(node, { action: 'annotate', pattern: { id: 'pressure.urgency', label: 'Urgency message' }, confidence: 'confirmed' });
    const before = node.nextElementSibling?.className || '';
    EXP.Actions.prune();
    return { before, after: node.nextElementSibling?.className || '' };
  });
  assert.deepEqual(result, { before: 'exp-ward-annotation', after: 'exp-ward-annotation' });
});

for (const role of ['', ' role="img"']) test(`a non-zero-size deal-progress target with its own non-empty aria-label shows a message${role ? ' with role=img' : ''}`, async (t) => {
  const page = await amazonPage(t, `<div id="dealProgress_feature_div"${role} aria-label="  Only 2 left  " style="width:120px;height:20px"></div>`);
  assert.deepEqual(await urgency(page), ['dealProgress_feature_div']);
});

for (const ariaLabel of ['', '   ']) test(`a textless message target with ${ariaLabel ? 'a whitespace-only' : 'an empty'} own aria-label still counts as empty`, async (t) => {
  const page = await amazonPage(t, `<div id="dealProgress_feature_div" aria-label="${ariaLabel}" style="width:120px;height:20px"></div>`);
  assert.deepEqual(await urgency(page), []);
  const result = await page.evaluate(() => {
    const node = document.getElementById('dealProgress_feature_div');
    EXP.Actions.apply(node, { action: 'annotate', pattern: { id: 'pressure.urgency', label: 'Urgency message' }, confidence: 'confirmed' });
    const before = node.nextElementSibling?.className || '';
    EXP.Actions.prune();
    return { before, after: node.nextElementSibling?.className || '' };
  });
  assert.deepEqual(result, { before: 'exp-ward-annotation', after: '' });
});

test('annotation labels are at least 12px and wrap', async (t) => {
  const page = await amazonPage(t, '<div style="width:120px"><div id="dealBadge_feature_div">Limited time deal</div></div>');
  const label = await page.evaluate(() => {
    const node = document.getElementById('dealBadge_feature_div');
    EXP.Actions.apply(node, { action: 'annotate', pattern: EXP.Patterns.get?.('pressure.urgency') || { id: 'pressure.urgency', label: 'Urgency message' }, confidence: 'confirmed' });
    const companion = node.nextElementSibling, cs = getComputedStyle(companion);
    return { className: companion.className, size: parseFloat(cs.fontSize), whiteSpace: cs.whiteSpace, overflow: companion.scrollWidth - companion.clientWidth };
  });
  assert.equal(label.className, 'exp-ward-annotation');
  assert.ok(label.size >= 12, 'label text size: ' + JSON.stringify(label));
  assert.ok(label.whiteSpace !== 'nowrap' && label.overflow <= 0, 'label wraps inside its column: ' + JSON.stringify(label));
});

test('an urgency label is removed when its message disappears', async (t) => {
  const page = await amazonPage(t, '<div id="dealProgress_feature_div"><span>23% claimed</span></div>');
  const result = await page.evaluate(() => {
    const node = document.getElementById('dealProgress_feature_div');
    EXP.Actions.apply(node, { action: 'annotate', pattern: { id: 'pressure.urgency', label: 'Urgency message' }, confidence: 'confirmed' });
    const before = node.nextElementSibling?.className || '';
    node.innerHTML = '\n  ';
    EXP.Actions.prune();
    return { before, after: node.nextElementSibling?.className || '' };
  });
  assert.deepEqual(result, { before: 'exp-ward-annotation', after: '' });
});
