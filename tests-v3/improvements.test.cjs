'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const moduleNames = ['core.js','settings.js','patterns.js','audit.js','amazon-adapter.js','activity.js','page-styles.js','actions.js','layout.js','engine.js'];
const runtime = `${fs.readFileSync(path.join(root,'vendor/exp-core/exp-core.js'),'utf8')}\nconst EXP={};${moduleNames.map((name) => fs.readFileSync(path.join(root,'src',name),'utf8')).join('\n')}window.EXP=EXP;`;
const distribution = fs.readFileSync(path.join(root,'ward.user.js'),'utf8');

async function modulePage(browser, body, pathname = '/dp/test') {
  const page = await browser.newPage();
  await page.route('https://www.amazon.com/**', (route) => route.fulfill({ status:200, contentType:'text/html', body }));
  await page.goto(`https://www.amazon.com${pathname}`);
  await page.addScriptTag({ content:runtime });
  await page.evaluate(() => EXP.Settings.load());
  return page;
}

test('Amazon fixture matrix exercises expected detector families on every supported page type', async (t) => {
  const browser = await chromium.launch({ headless:true });
  t.after(() => browser.close());
  const routes = { home:'/', search:'/s?k=ward', product:'/dp/ward', cart:'/cart', checkout:'/checkout/ward', dynamic:'/dp/dynamic' };
  for (const [name, pathname] of Object.entries(routes)) {
    const html = fs.readFileSync(path.join(root,'tests-v3/fixtures/amazon',`${name}.html`),'utf8');
    const page = await modulePage(browser,html,pathname);
    const result = await page.evaluate(() => {
      const expected = document.body.dataset.expectedDetectors.split(',');
      EXP.Engine.start();
      const adapter = EXP.Engine.diagnostics().adapter;
      return { expected, pageType:adapter.pageType, health:adapter.health, matched:adapter.coverage.matchedDetectors };
    });
    assert.equal(result.health,'healthy',name);
    for (const detector of result.expected) assert.ok(result.matched.includes(detector),`${name}: ${detector}`);
    await page.close();
  }
});

test('temporary reveal leaves a Protect again control and re-applies the original action', async (t) => {
  const browser = await chromium.launch({ headless:true });
  t.after(() => browser.close());
  const page = await modulePage(browser,'<!doctype html><html><body><div id="sims-fbt">Recommendations</div></body></html>');
  const result = await page.evaluate(async () => {
    EXP.Engine.start();
    const node = document.querySelector('#sims-fbt');
    const id = EXP.Actions.snapshot()[0].id;
    EXP.Actions.reveal(id);
    const revealed = { hidden:node.hidden, control:node.nextElementSibling?.textContent, count:EXP.Activity.snapshot().reveals.length };
    node.nextElementSibling.click();
    const protectedAgain = { hidden:node.hidden, control:node.nextElementSibling?.textContent, revealed:EXP.Actions.snapshot()[0].revealed };
    return { revealed, protectedAgain };
  });
  assert.deepEqual(result.revealed,{ hidden:false, control:'Protect again', count:1 });
  assert.deepEqual(result.protectedAgain,{ hidden:true, control:'Protected by WARDShow', revealed:false });
});

test('dim presentation survives when page style elements are blocked', async (t) => {
  const browser = await chromium.launch({ headless:true });
  t.after(() => browser.close());
  const page = await modulePage(browser,'<!doctype html><html><body><div id="dealBadge_feature_div">Deal</div></body></html>');
  const result = await page.evaluate(async () => {
    const originalAppend = Element.prototype.append;
    Element.prototype.append = function(...nodes) {
      return originalAppend.apply(this,nodes.filter((node) => !(node instanceof HTMLStyleElement)));
    };
    EXP.Engine.start();
    const node = document.querySelector('#dealBadge_feature_div');
    await new Promise((resolve) => setTimeout(resolve, 200));
    return { action:node.dataset.wardAction, dimmed:node.classList.contains('exp-ward-dimmed'), priority:node.style.getPropertyPriority('opacity'), opacity:getComputedStyle(node).opacity };
  });
  assert.equal(result.action,'dim');
  assert.equal(result.dimmed,true);
  assert.equal(result.priority,'important');
  assert.ok(Number(result.opacity) < 0.7, JSON.stringify(result));
});

test('adapter coverage remains route-wide after an empty incremental scan', async (t) => {
  const browser = await chromium.launch({ headless:true });
  t.after(() => browser.close());
  const page = await modulePage(browser,'<!doctype html><html><body><div id="dealBadge_feature_div">Deal</div><div id="unrelated">Other</div></body></html>');
  const result = await page.evaluate(() => {
    EXP.AmazonAdapter.nextEpoch();
    EXP.AmazonAdapter.detect([document]);
    const first = EXP.AmazonAdapter.diagnose().coverage;
    EXP.AmazonAdapter.detect([document.querySelector('#unrelated')]);
    const afterIncremental = EXP.AmazonAdapter.diagnose().coverage;
    return { first, afterIncremental };
  });
  assert.deepEqual(result.first.matchedDetectors,['amazon.urgency.deal']);
  assert.equal(result.first.matchedTargets,1);
  assert.deepEqual(result.afterIncremental.matchedDetectors,result.first.matchedDetectors);
  assert.equal(result.afterIncremental.matchedTargets,result.first.matchedTargets);
});

test('current Amazon Business and protection modules are detected as safe static containers', async (t) => {
  const browser = await chromium.launch({ headless:true });
  t.after(() => browser.close());
  const page = await modulePage(browser,'<!doctype html><html><body><div id="insuranceAndWarranty_feature_div" data-feature-name="insuranceAndWarranty"><label><input type="checkbox">Plan</label></div><div id="businessSavings_feature_div" data-feature-name="businessSavings"><button>Create account</button></div></body></html>');
  const result = await page.evaluate(() => {
    EXP.Engine.start();
    const protection = document.querySelector('#insuranceAndWarranty_feature_div');
    const business = document.querySelector('#businessSavings_feature_div');
    return {
      matched: EXP.Engine.diagnostics().adapter.coverage.matchedDetectors,
      protection: { action:protection.dataset.wardAction, hidden:protection.hidden, safe:EXP.AmazonAdapter.structuralSafety(protection) },
      business: { action:business.dataset.wardAction, hidden:business.hidden, safe:EXP.AmazonAdapter.structuralSafety(business) }
    };
  });
  assert.ok(result.matched.includes('amazon.plan.protection'));
  assert.ok(result.matched.includes('amazon.business.promo'));
  assert.deepEqual(result.protection,{ action:'collapse', hidden:true, safe:{ safe:true, reason:'known-static' } });
  assert.deepEqual(result.business,{ action:'collapse', hidden:true, safe:{ safe:true, reason:'known-static' } });
});

test('coupon quarantine is visible and can be explicitly resumed', async (t) => {
  const browser = await chromium.launch({ headless:true });
  t.after(() => browser.close());
  const page = await modulePage(browser,'<!doctype html><html><body><div data-component-type="s-coupon-component"><label class="s-coupon-tile unclaimed"><input id="coupon" type="checkbox"></label></div></body></html>','/s?k=coupon');
  await page.evaluate(() => {
    const coupon = document.querySelector('#coupon');
    coupon.addEventListener('click',() => history.pushState({},'',`/s?k=${Date.now()}`),{ once:true });
    EXP.Engine.start();
  });
  await page.waitForTimeout(350);
  const quarantined = await page.evaluate(() => EXP.Engine.diagnostics().coupon);
  assert.equal(quarantined.quarantined,true);
  assert.equal(quarantined.state,'quarantined');
  await page.evaluate(() => {
    const coupon = document.querySelector('#coupon');
    coupon.checked = false;
    coupon.closest('.s-coupon-tile').classList.add('unclaimed');
    coupon.addEventListener('click',() => coupon.closest('.s-coupon-tile').classList.remove('unclaimed'),{ once:true });
    EXP.Engine.resumeCoupons();
  });
  await page.waitForTimeout(350);
  const resumed = await page.evaluate(() => EXP.Engine.diagnostics().coupon);
  assert.equal(resumed.quarantined,false);
  assert.equal(resumed.state,'confirmed');
});

test('compact UI exposes health, activity, reversible controls, and nested Custom policy', async (t) => {
  const browser = await chromium.launch({ headless:true });
  t.after(() => browser.close());
  const page = await browser.newPage({ viewport:{ width:900,height:700 } });
  await page.route('https://www.amazon.com/**',(route) => route.fulfill({ status:200,contentType:'text/html',body:'<!doctype html><html><body><div id="sims-fbt">Recommendations</div></body></html>' }));
  await page.goto('https://www.amazon.com/dp/ward');
  await page.addScriptTag({ content:distribution });
  const host = page.locator('#exp-ward-root');
  await host.locator('.ward-launcher').click();
  await host.locator('.route[data-view="page"]').click();
  assert.equal(await host.locator('[data-exp-adapter-health]').textContent(),'Healthy');
  assert.equal(await host.locator('[data-exp-activity-summary]').getByText('Active protections').count(),1);
  assert.equal(await host.getByRole('button',{ name:'Show',exact:true }).count(),1);
  await host.getByRole('button',{ name:'Show',exact:true }).click();
  assert.equal(await host.getByRole('button',{ name:'Protect again',exact:true }).count(),1);
  await host.getByLabel('Protection level').selectOption('custom');
  await host.locator('.route[data-view="tools"]').click();
  for (const label of ['Default action','Confidence policy','Explanation detail']) assert.equal(await host.getByLabel(label).count(),1);
  assert.ok(await host.getByText('Category controls',{ exact:true }).isVisible());
  assert.ok(await host.getByText('Individual patterns',{ exact:true }).isVisible());
});

test('main Protection screen changes all content between Dim, Hide and Automatic and remembers the choice', async (t) => {
  const browser=await chromium.launch({headless:true}); t.after(() => browser.close());
  const page=await browser.newPage({viewport:{width:900,height:700}});
  await page.route('**/*',route => route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html><body><div id="ad" data-component-type="s-sponsored-result">Sponsored</div><div id="sims-fbt">Recommendations</div></body></html>'}));
  const open=async () => {
    await page.addScriptTag({content:distribution});
    const host=page.locator('#exp-ward-root');
    await host.locator('.ward-launcher').click();
    await host.locator('.route[data-view="page"]').click();
    return host;
  };
  const state=() => page.evaluate(() => ['ad','sims-fbt'].map(id => {const n=document.getElementById(id);return {hidden:n.hidden,action:n.dataset.wardAction};}));
  await page.goto('https://www.amazon.com/dp/ward'); let host=await open();
  assert.equal(await host.getByLabel('Content action',{exact:true}).inputValue(),'automatic');
  await host.getByLabel('Content action',{exact:true}).selectOption('dim');
  assert.deepEqual(await state(),Array(2).fill({hidden:false,action:'dim'}));
  await page.reload(); host=await open();
  assert.equal(await host.getByLabel('Content action',{exact:true}).inputValue(),'dim');
  assert.deepEqual(await state(),Array(2).fill({hidden:false,action:'dim'}));
  await host.getByLabel('Content action',{exact:true}).selectOption('hide');
  assert.deepEqual(await state(),Array(2).fill({hidden:true,action:'hide'}));
  await host.getByLabel('Content action',{exact:true}).selectOption('automatic');
  assert.deepEqual(await state(),[{hidden:true,action:'hide'},{hidden:true,action:'collapse'}]);
  assert.equal(await host.locator('input[type="checkbox"]').count(),0);
});
