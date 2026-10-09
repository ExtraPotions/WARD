'use strict';

// Regenerates the README screenshots from the built userscript against a local sample page.
//   npm run visual:capture
// Images are captured into a temporary folder first, so a failed run never leaves docs/screenshots half updated.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'docs', 'screenshots');
const HOST = '#exp-ward-root';

// [section, tab, file]
const shots = [
  ['Protection', 'Overview', 'protection.png'],
  ['Amazon', 'Store', 'amazon.png'],
];

const samplePage = '<!doctype html><meta charset="utf-8"><title>Amazon</title><body style="margin:0;font:17px/1.6 system-ui;background:#f4f5f8;color:#1b1d22"><main style="max-width:560px;margin:40px;padding:32px 36px;background:#fff;border:1px solid #d9dde5;border-radius:14px"><h1>Sample product</h1><p>Product details for a sample listing.</p></main></body>';

function gmStub() {
  const values = new Map();
  window.GM_getValue = (key, fallback) => (values.has(key) ? values.get(key) : fallback);
  window.GM_setValue = (key, value) => values.set(key, value);
  window.GM_deleteValue = (key) => values.delete(key);
  window.GM_listValues = () => [...values.keys()];
  window.GM_addValueChangeListener = () => 1;
  window.GM_registerMenuCommand = () => {};
  window.GM_xmlhttpRequest = (options) => { queueMicrotask(() => options.onerror?.({ status: 0 })); return { abort() {} }; };
}

// Use Playwright's bundled Chromium when installed, otherwise the system Edge.
const launch = () => chromium.launch().catch(() => chromium.launch({ channel: 'msedge' }));

(async () => {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'ward-shots-'));
  const browser = await launch();
  try {
    const page = await browser.newPage({ viewport: { width: 960, height: 1400 }, deviceScaleFactor: 2 });
    await page.addInitScript(gmStub);
    await page.route('**/*', (route) => {
      const asset = route.request().url().match(/raw\.githubusercontent\.com\/ExtraPotions\/WARD\/main\/(assets\/.+)$/);
      if (asset) return route.fulfill({ path: path.join(root, asset[1]) });
      if (route.request().isNavigationRequest()) return route.fulfill({ status: 200, contentType: 'text/html', body: samplePage });
      return route.abort();
    });
    await page.goto('https://www.amazon.com/dp/sample');
    await page.addScriptTag({ content: fs.readFileSync(path.join(root, 'ward.user.js'), 'utf8') });
    const host = page.locator(HOST);
    await host.locator('[data-exp-part="launcher"]').click();
    await page.waitForTimeout(400);
    for (const [section, tab, file] of shots) {
      const header = host.locator('.fl-tool-header').filter({ hasText: section });
      if (await header.getAttribute('aria-expanded') !== 'true') await header.click();
      await host.getByRole('tab', { name: tab, exact: true }).click();
      await page.mouse.move(0, 0);
      await page.waitForTimeout(300);
      await host.locator('[data-exp-part="dock"]').screenshot({ path: path.join(work, file) });
    }
    fs.mkdirSync(output, { recursive: true });
    for (const [, , file] of shots) fs.copyFileSync(path.join(work, file), path.join(output, file));
  } finally {
    await browser.close();
    fs.rmSync(work, { recursive: true, force: true });
  }
  console.log(`Captured ${shots.length} WARD screenshots in ${path.relative(root, output)}/`);
})().catch((error) => { console.error(error); process.exit(1); });
