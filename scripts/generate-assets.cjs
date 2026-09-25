'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');

(async () => {
  const svg = fs.readFileSync(path.join(root, 'assets', 'ward.svg')).toString('base64');
  const browser = await chromium.launch({ headless: true });
  try {
    for (const size of [128, 48, 32]) {
      const page = await browser.newPage({ viewport: { width: size + 16, height: size + 16 } });
      await page.setContent(`<style>*{margin:0}body{padding:8px;background:transparent}img{display:block;width:${size}px;height:${size}px}</style><img src="data:image/svg+xml;base64,${svg}">`);
      await page.locator('img').screenshot({ path: path.join(root, 'assets', `ward-${size}.png`), omitBackground: true });
      await page.close();
    }
  } finally {
    await browser.close();
  }
  console.log('Generated WARD 128 px, 48 px, and 32 px badge derivatives.');
})().catch((error) => { console.error(error); process.exit(1); });
