'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');

test('WARD menu has one primary action and a header status', async (t) => {
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  const page = await browser.newPage();
  await page.route('https://www.amazon.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html><body><main>Amazon fixture</main></body></html>' }));
  await page.goto('https://www.amazon.com/');
  await page.addScriptTag({ content: fs.readFileSync(path.join(root, 'ward.user.js'), 'utf8') });
  const host = page.locator('#exp-ward-root');
  await host.locator('.ward-launcher').click();
  const primary = host.locator('[data-exp-primary="1"]');
  assert.equal(await primary.count(), 1);
  assert.equal((await primary.textContent()).trim(), 'Reapply protection');
  assert.ok((await host.locator('[data-exp-part="status"]').textContent()).trim().length > 0);
});
