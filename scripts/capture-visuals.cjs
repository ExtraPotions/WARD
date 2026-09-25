'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'docs', 'screenshots');

const shots = [
  { file: 'menu-overview.png', view: null, theme: null },
  { file: 'ember.png', view: 'look', theme: 'Ember' },
  { file: 'midnight.png', view: 'look', theme: 'Midnight' },
  { file: 'high-contrast.png', view: 'look', theme: 'High contrast' },
  { file: 'pride.png', view: 'look', theme: 'Pride' },
  { file: 'ward-gem.png', view: 'look', theme: 'WARD gem' },
];

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 820 }, deviceScaleFactor: 1 });
    await page.route('https://www.amazon.com/**', (route) => route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><html><body style="margin:0;background:#eef1f5;font:16px system-ui;color:#17191d"><main style="max-width:760px;margin:40px;padding:30px;background:white;border:1px solid #ccd2db;border-radius:14px"><h1>WARD Amazon fixture</h1><p>Controlled local content for visual verification.</p><div id="primeDPUpsellStaticContainerNPA">Prime membership promotion</div><div id="dealBadge_feature_div">Limited-time deal</div><div id="sims-fbt">Recommended products</div></main></body></html>',
    }));
    await page.goto('https://www.amazon.com/dp/ward-visual-fixture');
    await page.addScriptTag({ content: fs.readFileSync(path.join(root, 'ward.user.js'), 'utf8') });
    const host = page.locator('#exp-ward-root');
    await host.evaluate((node) => {
      const root = node.shadowRoot;
      root.querySelector('.ward-launcher').click();
      root.querySelector('.route[data-view="page"]').click();
    });
    await page.screenshot({ path: path.join(output, 'current-fixture.png'), fullPage: true });
    for (const shot of shots) {
      await host.evaluate((node, { view, theme }) => {
        const root = node.shadowRoot;
        root.querySelector('.close')?.click();
        root.querySelector('.ward-launcher').click();
        for (const button of root.querySelectorAll('.route[aria-expanded="true"]')) button.click();
        if (view) root.querySelector(`.route[data-view="${view}"]`).click();
        if (theme) root.querySelector(`.exp-theme-swatch[aria-label="${theme}"]`)?.click();
      }, { view: shot.view, theme: shot.theme });
      const clip = await host.evaluate(() => {
        const rect = document.querySelector('#exp-ward-root').shadowRoot.querySelector('.ward').getBoundingClientRect();
        return { x: Math.max(0, rect.x - 8), y: Math.max(0, rect.y - 8), width: rect.width + 16, height: rect.height + 16 };
      });
      await page.screenshot({ path: path.join(output, shot.file), clip });
    }
    const hashes = ['current-fixture.png',...shots.map(({ file }) => file)].map((file) => crypto.createHash('sha256').update(fs.readFileSync(path.join(output, file))).digest('hex'));
    if (new Set(hashes).size !== hashes.length) throw new Error('WARD screenshot capture produced duplicate images');
  } finally {
    await browser.close();
  }
  console.log(`Captured ${shots.length + 1} WARD screenshots in ${path.relative(root, output)}/`);
})().catch((error) => { console.error(error); process.exit(1); });
