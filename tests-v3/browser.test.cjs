'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const moduleNames = ['core.js','settings.js','patterns.js','audit.js','amazon-adapter.js','activity.js','page-styles.js','actions.js','layout.js','engine.js'];
const runtime = `${fs.readFileSync(path.join(root,'vendor/exp-core/exp-core.js'),'utf8')}\nconst EXP={};${moduleNames.map((name) => fs.readFileSync(path.join(root,'src',name),'utf8')).join('\n')}window.EXP=EXP;`;
const distribution = fs.readFileSync(path.join(root, 'ward.user.js'), 'utf8');

test('WARD does not mount a launcher inside an iframe', async (t) => {
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  const page = await browser.newPage();
  await page.setContent('<!doctype html><html><body><iframe srcdoc="<!doctype html><html><body><main>Embedded</main></body></html>"></iframe></body></html>');
  const frame = page.frames().find((candidate) => candidate !== page.mainFrame());
  await frame.evaluate(() => { const values = new Map(); window.GM_getValue = (key, fallback) => values.has(key) ? values.get(key) : fallback; window.GM_setValue = (key, value) => values.set(key, value); window.GM_xmlhttpRequest = () => {}; });
  await frame.addScriptTag({ content: distribution });
  await page.waitForTimeout(100);
  assert.equal(await frame.locator('#exp-ward-root').count(), 0);
});
async function amazonPage(browser, body, pathname = '/dp/test') {
  const page = await browser.newPage();
  await page.route('https://www.amazon.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: `<!doctype html><html><body>${body}</body></html>` }));
  await page.goto(`https://www.amazon.com${pathname}`);
  await page.addScriptTag({ content: runtime });
  await page.evaluate(() => EXP.Settings.load());
  return page;
}

test('Pride theme visibly recolors the menu with rainbow borders and accents', async (t) => {
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  await page.route('https://www.amazon.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html><body><main>Product</main></body></html>' }));
  await page.goto('https://www.amazon.com/dp/test');
  await page.addScriptTag({ content: distribution });
  await page.waitForSelector('#exp-ward-root', { state: 'attached' });
  const facts = await page.locator('#exp-ward-root').evaluate((host) => {
    const root = host.shadowRoot;
    const readTheme = (label) => {
      root.querySelector(`.exp-theme-swatch[aria-label="${label}"]`)?.click();
      const panel = root.querySelector('.ward');
      const divider = root.querySelector('.header-divider');
      const activeRoute = root.querySelector('.route[aria-current="page"]');
      const checkedSwitch = root.querySelector('.switch[aria-checked="true"]');
      const panelStyles = getComputedStyle(panel);
      return {
        bg: panelStyles.backgroundColor,
        panelImage: panelStyles.backgroundImage,
        accent: getComputedStyle(host).getPropertyValue('--accent').trim(),
        divider: getComputedStyle(divider).backgroundImage,
        activeRoute: activeRoute ? getComputedStyle(activeRoute).backgroundImage : '',
        checkedSwitch: checkedSwitch ? getComputedStyle(checkedSwitch).backgroundImage : '',
        uiTheme: host.dataset.uiTheme,
      };
    };
    root.querySelector('.ward-launcher').click();
    root.querySelector('.route[data-view="look"]').click();
    const ember = readTheme('Ember');
    const ward = readTheme('WARD gem');
    const pride = readTheme('Pride');
    return { ember, ward, pride };
  });
  assert.equal(facts.pride.uiTheme, 'pride');
  assert.notEqual(facts.pride.bg, facts.ember.bg);
  assert.notEqual(facts.pride.bg, facts.ward.bg);
  assert.notEqual(facts.pride.accent, facts.ember.accent);
  assert.notEqual(facts.pride.accent, facts.ward.accent);
  assert.equal(facts.pride.accent, '#c34f7d');
  assert.match(facts.pride.divider, /linear-gradient/i);
  assert.match(facts.pride.divider, /200,\s*78,\s*102|#c84e66/i);
  assert.match(facts.pride.divider, /61,\s*121,\s*166|#3d79a6/i);
  assert.doesNotMatch(facts.pride.divider, /rgba\(0,\s*0,\s*0,\s*0\).*c84e66|transparent.*#c84e66/i);
  assert.match(facts.pride.panelImage, /linear-gradient/i);
  assert.match(facts.pride.panelImage, /200,\s*78,\s*102|#c84e66/i);
  assert.doesNotMatch(facts.pride.activeRoute, /linear-gradient/i);
  assert.doesNotMatch(facts.pride.checkedSwitch, /linear-gradient/i);
});

test('WARD palette recolors the shell and settings stay single-column without nested scrolling', async (t) => {
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  await page.route('https://www.amazon.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html><body><main>Product</main></body></html>' }));
  await page.goto('https://www.amazon.com/dp/test');
  await page.addScriptTag({ content: distribution });
  await page.waitForSelector('#exp-ward-root', { state: 'attached' });
  const facts = await page.locator('#exp-ward-root').evaluate((host) => {
    const root = host.shadowRoot;
    root.querySelector('.ward-launcher').click();
    root.querySelector('.route[data-view="look"]').click();
    const panel = root.querySelector('.ward');
    const before = getComputedStyle(panel).backgroundColor;
    root.querySelector('.exp-theme-swatch[aria-label="Midnight"]').click();
    const body = root.querySelector('.fl-tool-body:not([hidden])');
    return {
      before,
      after: getComputedStyle(panel).backgroundColor,
      border: getComputedStyle(panel).borderTopWidth,
      overflow: getComputedStyle(body).overflow,
      maxHeight: getComputedStyle(body).maxHeight,
      columns: [...body.querySelectorAll('.section')].map((section) => getComputedStyle(section).gridTemplateColumns),
      swatches: [...root.querySelectorAll('.exp-theme-swatch')].map((item) => item.getAttribute('aria-label')),
    };
  });
  assert.notEqual(facts.after, facts.before);
  assert.equal(facts.border, '1px');
  assert.equal(facts.overflow, 'visible');
  assert.equal(facts.maxHeight, 'none');
  assert.ok(facts.columns.every((value) => value.trim().split(/\s+/).length === 1), JSON.stringify(facts));
  assert.deepEqual(facts.swatches, ['Ember', 'Midnight', 'Glacier', 'High contrast', 'Verdant', 'Pride', 'Crimson', 'WARD gem']);
});

test('adapter classifies pages and isolates Amazon selectors from generic patterns', async (t) => {
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  const page = await amazonPage(browser, '<div id="primeDPUpsellStaticContainerNPA">Prime</div>');
  const result = await page.evaluate(() => ({ page: EXP.AmazonAdapter.classify(), evidence: EXP.AmazonAdapter.detect([document]).map(({ detectorId, patternId, confidence }) => ({ detectorId, patternId, confidence })) }));
  assert.equal(result.page, 'product');
  assert.deepEqual(result.evidence, [{ detectorId: 'amazon.prime.product', patternId: 'upsell.membership.prime', confidence: 'confirmed' }]);
});

test('Amazon Rufus page-root classes never make document roots intervention targets', async (t) => {
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  const page = await amazonPage(browser, '<div id="a-page" data-testid="rufus-shell"><main>Amazon home</main></div><div id="rufus-container">Rufus</div>', '/');
  const result = await page.evaluate(() => {
    document.body.className = 'a-m-us rufus-cl-alexa-plus rufus-docked-only a-meter-animate';
    EXP.Engine.start();
    const pageRoot = document.querySelector('#a-page');
    const rufus = document.querySelector('#rufus-container');
    return {
      body: {
        hidden: document.body.hidden,
        inert: document.body.hasAttribute('inert'),
        action: document.body.dataset.wardAction || '',
        instance: document.body.dataset.wardInstance || '',
        display: document.body.style.getPropertyValue('display')
      },
      pageRoot: {
        hidden: pageRoot.hidden,
        inert: pageRoot.hasAttribute('inert'),
        action: pageRoot.dataset.wardAction || '',
        instance: pageRoot.dataset.wardInstance || '',
        display: pageRoot.style.getPropertyValue('display')
      },
      rufus: {
        hidden: rufus.hidden,
        action: rufus.dataset.wardAction || ''
      },
      structuralSkipped: EXP.Activity.snapshot().totals.structuralCollapseSkipped
    };
  });
  assert.deepEqual(result.body, { hidden: false, inert: false, action: '', instance: '', display: '' });
  assert.deepEqual(result.pageRoot, { hidden: false, inert: false, action: '', instance: '', display: '' });
  assert.deepEqual(result.rufus, { hidden: false, action: 'dim' });
  assert.equal(result.structuralSkipped, 1);
});

test('action layer refuses document-root interventions', async (t) => {
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  const page = await amazonPage(browser, '<main>Amazon</main>');
  const result = await page.evaluate(() => {
    const pattern = EXP.Patterns.get('pressure.shopping-assistant');
    const proposal = { action: 'collapse', pattern, confidence: 'confirmed' };
    const htmlResult = EXP.Actions.apply(document.documentElement, proposal);
    const bodyResult = EXP.Actions.apply(document.body, proposal);
    return {
      htmlResult,
      bodyResult,
      htmlAction: document.documentElement.dataset.wardAction || '',
      bodyAction: document.body.dataset.wardAction || '',
      htmlHidden: document.documentElement.hidden,
      bodyHidden: document.body.hidden
    };
  });
  assert.equal(result.htmlResult, null);
  assert.equal(result.bodyResult, null);
  assert.equal(result.htmlAction, '');
  assert.equal(result.bodyAction, '');
  assert.equal(result.htmlHidden, false);
  assert.equal(result.bodyHidden, false);
});

test('essential purchasing overlap caps Prime treatment at annotate', async (t) => {
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  const page = await amazonPage(browser, '<div id="buybox"><div id="primeDPUpsellStaticContainerNPA">Prime and delivery</div></div>');
  const result = await page.evaluate(() => { EXP.Engine.start(); const node = document.querySelector('#primeDPUpsellStaticContainerNPA'); return { hidden: node.hidden, action: node.dataset.wardAction, annotation: node.nextElementSibling?.textContent }; });
  assert.deepEqual(result, { hidden: false, action: 'annotate', annotation: 'WARD: Prime membership promotion' });
});

test('Hide, Dim, Collapse, Annotate, Allow, and Temporary Reveal visibly differ and restore', async (t) => {
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  const page = await amazonPage(browser, '<div id="target"><button>Native</button></div>');
  const result = await page.evaluate(() => {
    const node = document.querySelector('#target'); const pattern = EXP.Patterns.get('cross-sell.recommendation'); const states = {};
    for (const action of ['hide','dim','collapse','annotate','allow']) { const id = EXP.Actions.apply(node,{action,pattern,confidence:'confirmed'}); states[action] = { hidden: node.hidden, display: getComputedStyle(node).display, opacity: getComputedStyle(node).opacity, className: node.className, companion: node.nextElementSibling?.className || '', companionBorder: node.nextElementSibling ? getComputedStyle(node.nextElementSibling).borderStyle : '', ledger: EXP.Actions.snapshot().find((item)=>item.id===id)?.action || '' }; }
    const id = EXP.Actions.apply(node,{action:'collapse',pattern,confidence:'confirmed'}); EXP.Actions.reveal(id); states.reveal = { hidden: node.hidden, revealed: node.dataset.wardRevealed, saved: EXP.Actions.snapshot().find((item)=>item.id===id).action }; EXP.Actions.restoreAll(); states.restored = { hidden: node.hidden, action: node.dataset.wardAction || '', companion: node.nextElementSibling?.className || '', opacity:node.style.getPropertyValue('opacity'), filter:node.style.getPropertyValue('filter') }; return states;
  });
  assert.equal(result.hide.hidden, true);
  assert.equal(result.hide.display, 'none');
  assert.match(result.dim.className, /exp-ward-dimmed/);
  assert.ok(Number(result.dim.opacity) < 0.7);
  assert.equal(result.collapse.companion, 'exp-ward-collapse');
  assert.equal(result.collapse.companionBorder, 'solid');
  assert.equal(result.annotate.companion, 'exp-ward-annotation');
  assert.equal(result.allow.ledger, 'allow');
  assert.deepEqual(result.reveal, { hidden: false, revealed: '1', saved: 'collapse' });
  assert.deepEqual(result.restored, { hidden: false, action: '', companion: '', opacity:'', filter:'' });
});

test('automatic default-on coupon clipping activates exactly once and counts only confirmed state', async (t) => {
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  const page = await amazonPage(browser, '<div data-component-type="s-coupon-component"><label class="s-coupon-tile unclaimed"><input id="coupon" type="checkbox"></label></div>', '/s?k=test');
  await page.evaluate(() => { window.clicks = 0; const coupon = document.querySelector('#coupon'); coupon.addEventListener('click', () => { window.clicks += 1; coupon.closest('.s-coupon-tile').classList.remove('unclaimed'); }); EXP.Engine.start(); EXP.Engine.processBatch([document]); });
  await page.waitForTimeout(400);
  const result = await page.evaluate(() => ({ clicks: window.clicks, checked: document.querySelector('#coupon').checked, attempted: document.querySelector('#coupon').dataset.wardCouponAttempted, activity: EXP.Activity.snapshot() }));
  assert.equal(result.clicks, 1);
  assert.equal(result.checked, true);
  assert.equal(result.attempted, '1');
  assert.equal(result.activity.totals.couponsConfirmed, 1);
  assert.equal(result.activity.totals.couponsFailed, 0);
});

test('coupon gate rejects unsafe checkout context and disabled setting', async (t) => {
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  const html = '<form id="checkout"><div data-component-type="s-coupon-component"><label class="s-coupon-tile unclaimed"><input id="unsafe" type="checkbox"></label></div></form><div data-component-type="s-coupon-component"><label class="s-coupon-tile unclaimed"><input id="safe" type="checkbox"></label></div>';
  const page = await amazonPage(browser, html, '/checkout/test');
  const result = await page.evaluate(() => { const unsafe = document.querySelector('#unsafe'); const safe = document.querySelector('#safe'); EXP.Settings.update({ autoClipCoupons: false }); EXP.Engine.start(); return { unsafe: EXP.AmazonAdapter.verifyCouponTarget(unsafe), unsafeChecked: unsafe.checked, safeChecked: safe.checked }; });
  assert.equal(result.unsafe.eligible, false);
  assert.equal(result.unsafe.reason, 'unsafe-context');
  assert.equal(result.unsafeChecked, false);
  assert.equal(result.safeChecked, false);
});

test('activity deduplicates unchanged interventions', async (t) => {
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  const page = await amazonPage(browser, '<div id="sims-fbt">Recommendations</div>');
  const result = await page.evaluate(() => { EXP.Engine.start(); EXP.Engine.processBatch([document]); EXP.Engine.processBatch([document]); return EXP.Activity.snapshot(); });
  assert.equal(result.active, 1);
  assert.equal(result.totals.interventions, 1);
});

test('engine rebuild forgets stale node records before reapplying an intervention', async (t) => {
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  const page = await amazonPage(browser, '<div id="primeDPUpsellStaticContainerNPA">Prime</div>');
  const result = await page.evaluate(() => {
    EXP.Engine.start();
    EXP.Engine.rebuild();
    EXP.Engine.rebuild();
    const node = document.querySelector('#primeDPUpsellStaticContainerNPA');
    return {
      action: node.dataset.wardAction,
      instance: node.dataset.wardInstance,
      active: EXP.Activity.snapshot().active,
    };
  });
  assert.equal(result.action, 'collapse');
  assert.match(result.instance, /^ward-\d+$/);
  assert.equal(result.active, 1);
});

test('compact search and compatibility recommendation cleanup are wired and reversible', async (t) => {
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  const page = await amazonPage(browser, '<div id="sims-fbt">More items</div><div data-component-type="s-search-result"><div class="a-section">Result</div></div>', '/s?k=test');
  const result = await page.evaluate(() => { EXP.Settings.update({ compactSearch: true, recommendationCleanup: true }); EXP.Engine.start(); const recommendation = document.querySelector('#sims-fbt'); const before = { compact: EXP.Layout.active(), hidden: recommendation.hidden, disclosure: recommendation.nextElementSibling?.className || '' }; EXP.Settings.update({ compactSearch: false, recommendationCleanup: false }); EXP.Engine.rebuild(); return { before, after: { compact: EXP.Layout.active(), hidden: recommendation.hidden, disclosure: recommendation.nextElementSibling?.className || '' } }; });
  assert.deepEqual(result.before, { compact: true, hidden: true, disclosure: 'exp-ward-collapse' });
  assert.deepEqual(result.after, { compact: false, hidden: false, disclosure: '' });
});

test('Core navigation observes pushState and restores its wrapper on cleanup', async (t) => {
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  const page = await amazonPage(browser, '<main>Route</main>');
  const result = await page.evaluate(async () => { const original = history.pushState; let calls = 0; const cleanup = EXP.Core.onNavigation(() => { calls += 1; }); const wrapped = history.pushState !== original; history.pushState({}, '', '/s?k=next'); await new Promise((resolve) => setTimeout(resolve, 0)); cleanup(); return { wrapped, calls, restored: history.pushState === original }; });
  assert.deepEqual(result, { wrapped: true, calls: 1, restored: true });
});

test('a real pointer click opens the launcher without a drag cancel', async (t) => {
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  await page.route('https://www.amazon.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html><body><div id="a-page"><main>Product</main></div></body></html>' }));
  await page.goto('https://www.amazon.com/dp/test');
  await page.addScriptTag({ content: distribution });
  await page.waitForSelector('#exp-ward-root', { state: 'attached' });
  const launcher = page.locator('#exp-ward-root').locator('.ward-launcher');
  await launcher.click();
  const open = await page.locator('#exp-ward-root').evaluate((host) => host.shadowRoot.querySelector('.ward').classList.contains('open'));
  assert.equal(open, true);
});

test('Amazon host clipping is repaired so the launcher stays clickable', async (t) => {
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  await page.route('https://www.amazon.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html><body><div id="a-page"><main>Product</main></div></body></html>' }));
  await page.goto('https://www.amazon.com/dp/test');
  await page.addScriptTag({ content: distribution });
  await page.waitForSelector('#exp-ward-root', { state: 'attached' });
  await page.evaluate(() => {
    const host = document.querySelector('#exp-ward-root');
    host.hidden = true;
    host.setAttribute('inert', '');
    host.setAttribute('aria-hidden', 'true');
    host.remove();
    document.body.append(document.createElement('div'));
  });
  await page.waitForFunction(() => {
    const host = document.querySelector('#exp-ward-root');
    return host?.isConnected && host.parentNode === document.documentElement && !host.hidden && !host.hasAttribute('inert');
  });
  const launcher = page.locator('#exp-ward-root').locator('.ward-launcher');
  await launcher.click();
  const open = await page.locator('#exp-ward-root').evaluate((host) => host.shadowRoot.querySelector('.ward').classList.contains('open'));
  assert.equal(open, true);
});

test('Amazon mutation batches keep open menu controls clickable', async (t) => {
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  await page.route('https://www.amazon.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html><body><div id="a-page"><main>Product</main><div id="primeDPUpsellStaticContainerNPA">Prime</div></div></body></html>' }));
  await page.goto('https://www.amazon.com/dp/test');
  await page.addScriptTag({ content: distribution });
  await page.waitForSelector('#exp-ward-root', { state: 'attached' });
  const host = page.locator('#exp-ward-root');
  await host.locator('.ward-launcher').click();
  await host.locator('.route[data-view="page"]').click();
  const protection = host.locator('[role="switch"][aria-label="WARD protection"]');
  await protection.evaluate((node) => { node.dataset.expProbe = '1'; });
  await page.evaluate(async () => {
    const pageRoot = document.querySelector('#a-page');
    for (let i = 0; i < 24; i += 1) {
      pageRoot.classList.toggle('a-meter-animate');
      document.body.classList.toggle('rufus-docked-only');
      document.documentElement.append(document.createElement('div'));
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  });
  const stillSameNode = await protection.evaluate((node) => node.dataset.expProbe === '1' && node.isConnected);
  assert.equal(stillSameNode, true);
  await protection.click();
  const after = await page.evaluate(() => {
    const root = document.querySelector('#exp-ward-root').shadowRoot;
    const stored = JSON.parse(localStorage.getItem('exp:v3:ward:settings') || 'null');
    return {
      checked: root.querySelector('[role="switch"][aria-label="WARD protection"]')?.getAttribute('aria-checked'),
      enabled: stored?.enabled
    };
  });
  assert.equal(after.checked, 'false');
  assert.equal(after.enabled, false);
});

test('menu stays compact and Settings is not a top-level route while interventions are active', async (t) => {
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.route('https://www.amazon.com/**', (route) => route.fulfill({
    status: 200,
    contentType: 'text/html',
    body: '<!doctype html><html><body><div id="a-page"><main>Product</main><div id="primeDPUpsellStaticContainerNPA">Prime</div></div></body></html>',
  }));
  await page.goto('https://www.amazon.com/dp/test');
  await page.addScriptTag({ content: distribution });
  const host = page.locator('#exp-ward-root');
  await host.locator('.ward-launcher').click();
  const panel = host.locator('.ward');
  assert.equal(await panel.evaluate((node) => node.getBoundingClientRect().width), 260);
  const facts = await host.evaluate((node) => {
    const root = node.shadowRoot;
    return {
      routes: [...root.querySelectorAll('.route')].map((item) => item.querySelector('.fl-tool-title')?.textContent.trim()),
      menuWidth: node.dataset.menuWidth,
    };
  });
  assert.deepEqual(facts.routes, ['Protection', 'Appearance', 'Amazon']);
  assert.equal(facts.menuWidth, 'compact');
  assert.deepEqual(pageErrors, []);
});

test('dynamic Amazon widgets downgrade structural actions instead of hiding DOM', async (t) => {
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  const page = await amazonPage(browser, '<div id="desktop-dp-sims_session-similarities-sims-feature" class="a-carousel-container"><video></video><button>Follow</button></div>');
  const result = await page.evaluate(() => {
    EXP.Engine.start();
    const node = document.querySelector('#desktop-dp-sims_session-similarities-sims-feature');
    const activity = EXP.Activity.snapshot();
    return {
      hidden: node.hidden,
      inert: node.hasAttribute('inert'),
      display: node.style.getPropertyValue('display'),
      action: node.dataset.wardAction || '',
      skipped: activity.totals.structuralCollapseSkipped,
      reasons: activity.structuralSkipsByReason
    };
  });
  assert.equal(result.hidden, false);
  assert.equal(result.inert, false);
  assert.equal(result.display, '');
  assert.equal(result.action, 'dim');
  assert.equal(result.skipped, 1);
  assert.equal(result.reasons['dynamic-widget'], 1);
});


test('static annotated Amazon content settles without WARD rewriting its own companion', async (t) => {
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  await page.route('https://www.amazon.com/**', (route) => route.fulfill({
    status: 200,
    contentType: 'text/html',
    body: '<!doctype html><html><body><div id="buybox"><div id="dealBadge_feature_div">Deal</div></div></body></html>'
  }));
  await page.goto('https://www.amazon.com/dp/test');
  await page.addScriptTag({ content: distribution });
  await page.waitForSelector('.exp-ward-annotation');
  const first = await page.locator('.exp-ward-annotation').evaluate((node) => {
    node.dataset.expStabilityProbe = '1';
    return node.textContent;
  });
  await page.waitForTimeout(700);
  const result = await page.locator('.exp-ward-annotation').evaluate((node) => ({
    text: node.textContent,
    sameNode: node.dataset.expStabilityProbe === '1',
    count: document.querySelectorAll('.exp-ward-annotation').length
  }));
  assert.equal(first, 'WARD: Urgency message');
  assert.deepEqual(result, { text:'WARD: Urgency message', sameNode:true, count:1 });
});

test('launcher omits the retired helper tooltip', async (t) => {
  const browser = await chromium.launch({ headless: true }); t.after(() => browser.close());
  const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
  await page.route('https://www.amazon.com/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html><body><main>Product</main></body></html>' }));
  await page.goto('https://www.amazon.com/dp/test');
  await page.addScriptTag({ content: distribution });
  await page.waitForSelector('#exp-ward-root', { state: 'attached' });
  const facts = await page.locator('#exp-ward-root').evaluate((host) => {
    const root = host.shadowRoot;
    const launcher = root.querySelector('.ward-launcher');
    const sheets = [...(root.adoptedStyleSheets || []), ...root.styleSheets];
    const hasTipBelowRule = sheets.some((sheet) => {
      try { return [...sheet.cssRules].some((rule) => String(rule.selectorText || '').includes('tip-below')); }
      catch { return false; }
    });
    const routeTips = [...root.querySelectorAll('.fl-tool-header,.route')].some((node) => node.dataset.tip || node.classList.contains('has-tooltip'));
    launcher.click();
    root.querySelector('.route[data-view="page"]')?.click();
    const headingTips = [...root.querySelectorAll('.route-body:not([hidden]) .section > h3')].some((node) => node.dataset.tip || node.classList.contains('has-tooltip'));
    const controlTips = [...root.querySelectorAll('.route-body:not([hidden]) .row')].some((node) => node.dataset.tip || node.classList.contains('has-tooltip'));
    return { hasTipBelowRule, help: launcher.dataset.help || '', routeTips, headingTips, controlTips };
  });
  assert.equal(facts.hasTipBelowRule, false);
  assert.equal(facts.help, '');
  assert.equal(facts.routeTips, false);
  assert.equal(facts.headingTips, false);
  assert.equal(facts.controlTips, false);
});
