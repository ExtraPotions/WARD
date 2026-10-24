'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');

test('Amazon keeps everyday switches up front and moves seller clarity and coverage into detail views', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
  await page.route('**/*', route => route.request().isNavigationRequest() ? route.fulfill({ status:200, contentType:'text/html', body:'<!doctype html><main>Product</main>' }) : route.abort());
  await page.addInitScript(() => {
    const values = new Map();
    window.GM_getValue = (key, fallback) => values.has(key) ? values.get(key) : fallback;
    window.GM_setValue = (key, value) => values.set(key, value);
    window.GM_xmlhttpRequest = options => { queueMicrotask(() => options.onerror?.({status:0})); return { abort() {} }; };
  });
  await page.goto('https://www.amazon.com/dp/B0TEST');
  await page.addScriptTag({ content:fs.readFileSync(path.join(root, 'ward.user.js'), 'utf8') });
  const host = page.locator('#exp-ward-root');
  await host.waitFor({ state:'attached' });
  await host.locator('[data-exp-part="launcher"]').click();
  await host.locator('[data-exp-section-tabs] [role=tab][aria-label="Amazon"]').click();
  const tools = host.locator('#exp-ward-view-tools');
  assert.deepEqual(await tools.locator(':scope > details > summary').allTextContents(), ['Coverage','Seller clarity','Retailer modules','Advanced Amazon','Settings transfer','Page tools']);
  assert.equal(await host.getByRole('switch', { name:'Protect Amazon', exact:true }).isVisible(), true);
  assert.equal(await host.getByRole('switch', { name:'Seller notes', exact:true }).isVisible(), false);
  assert.equal(await host.getByText('Coverage applies to recognized page patterns', { exact:false }).isVisible(), false);
  await tools.locator('summary').filter({ hasText:/^Seller clarity$/ }).click();
  assert.equal(await host.getByRole('switch', { name:'Seller notes', exact:true }).isVisible(), true);
  const label=host.locator('.row-copy strong').filter({hasText:/^Seller notes$/});assert.equal(await label.getAttribute('role'),null,'label does not compete with its switch');
  const control=host.getByRole('switch',{name:'Seller notes',exact:true});assert.equal(await control.getAttribute('aria-description'),'Notes on product pages when brand, seller or ratings deserve a second look.');await control.focus();assert.equal(await host.getByRole('tooltip').isVisible(),true);
});
