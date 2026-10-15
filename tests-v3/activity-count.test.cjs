'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const distribution = fs.readFileSync(path.join(root,'ward.user.js'),'utf8');

async function openProtect(browser, pathname, body) {
  const page = await browser.newPage({ viewport:{ width:900,height:700 } });
  await page.route('https://www.amazon.com/**',(route) => route.fulfill({ status:200,contentType:'text/html',body }));
  await page.goto('https://www.amazon.com'+pathname);
  await page.addScriptTag({ content:distribution });
  const host = page.locator('#exp-ward-root');
  await host.locator('.ward-launcher').click();
  await host.locator('[data-exp-section-tab="exp-ward-view-page"]').click();
  return host;
}

test('Activity row counts sponsored and other protections on this page', async (t) => {
  const browser = await chromium.launch({ headless:true });
  t.after(() => browser.close());
  const host = await openProtect(browser,'/s?k=ward',fs.readFileSync(path.join(root,'tests-v3/fixtures/amazon/search.html'),'utf8'));
  const count = host.locator('.exp-submenu-row:visible [data-ward-activity-count]');
  await count.waitFor();
  const match = /^(\d+) sponsored(?: · (\d+) other)?$/.exec(await count.textContent());
  assert.ok(match, await count.textContent());
  assert.ok(Number(match[1]) >= 1);
  const active = await host.locator('[data-exp-activity-summary] .tag').first().textContent();
  assert.equal(Number(match[1]) + Number(match[2] || 0), Number(active));
  assert.match(await count.locator('xpath=ancestor::button[1]').textContent(), /^Activity \d/);
  // The count sits on the row's single line beside the chevron rather than wrapping.
  const [label, badge] = [await count.locator('xpath=preceding-sibling::span[1]').boundingBox(), await count.boundingBox()];
  assert.ok(badge.height < 30, `count wraps: ${badge.height}px`);
  assert.ok(Math.abs((label.y + label.height / 2) - (badge.y + badge.height / 2)) < 4);
});

test('Activity row shows no count when nothing on the page is protected', async (t) => {
  const browser = await chromium.launch({ headless:true });
  t.after(() => browser.close());
  const host = await openProtect(browser,'/dp/ward','<!doctype html><html><body><main>Nothing to protect</main></body></html>');
  const row = host.locator('.exp-submenu-row:visible').filter({ hasText:/^Activity/ });
  await row.waitFor();
  await host.page().waitForTimeout(300);
  assert.equal(await row.locator('[data-ward-activity-count]').count(), 0);
  assert.equal((await row.textContent()).trim(), 'Activity');
});
