'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const moduleNames = [
  'core.js','settings.js','patterns.js','audit.js','amazon-adapter.js',
  'activity.js','page-styles.js','actions.js','layout.js','engine.js','diagnostics.js'
];
const runtime = `${fs.readFileSync(path.join(root,'vendor/exp-core/exp-core.js'),'utf8')}\nconst EXP={};${moduleNames.map((name) => fs.readFileSync(path.join(root,'src',name),'utf8')).join('\n')}window.EXP=EXP;`;

async function amazonPage(browser, body, pathname = '/dp/test') {
  const page = await browser.newPage();
  await page.route('https://www.amazon.com/**', (route) => route.fulfill({
    status: 200,
    contentType: 'text/html',
    body: `<!doctype html><html><body><div id="fixture-parent"><div id="before">Before</div>${body}<div id="after">After</div></div></body></html>`
  }));
  await page.goto(`https://www.amazon.com${pathname}`);
  await page.addScriptTag({ content: runtime });
  await page.evaluate(() => EXP.Settings.load());
  return page;
}

test('all 11 Amazon detector families produce the expected audited treatment', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());

  const fixtures = [
    { detector:'amazon.prime.product', pattern:'upsell.membership.prime', html:'<div id="primeDPUpsellStaticContainerNPA">Prime</div>', selector:'#primeDPUpsellStaticContainerNPA', requested:'collapse', applied:'collapse' },
    { detector:'amazon.urgency.deal', pattern:'pressure.urgency', html:'<div id="dealBadge_feature_div">Deal</div>', selector:'#dealBadge_feature_div', requested:'dim', applied:'dim' },
    { detector:'amazon.scarcity.stock', pattern:'pressure.scarcity', html:'<span id="target" aria-label="Only 2 left in stock">Low stock</span>', selector:'#target', requested:'annotate', applied:'annotate' },
    { detector:'amazon.subscription.sns', pattern:'pressure.subscription', html:'<div id="snsAccordionRowMiddle">Subscribe</div>', selector:'#snsAccordionRowMiddle', requested:'collapse', applied:'collapse' },
    { detector:'amazon.financial.credit', pattern:'upsell.financial-product', html:'<div id="creditCard_feature_div">Credit</div>', selector:'#creditCard_feature_div', requested:'collapse', applied:'collapse' },
    { detector:'amazon.plan.protection', pattern:'upsell.protection-plan', html:'<div id="protectionPlan_feature_div">Plan</div>', selector:'#protectionPlan_feature_div', requested:'collapse', applied:'collapse' },
    { detector:'amazon.business.promo', pattern:'upsell.business-membership', html:'<div id="target" data-feature-name="business-promo" class="promo">Business</div>', selector:'#target', requested:'collapse', applied:'dim' },
    { detector:'amazon.sponsored.placement', pattern:'sponsorship.placement', html:'<div id="target" data-component-type="s-sponsored-result">Sponsored</div>', selector:'#target', requested:'hide', applied:'hide' },
    { detector:'amazon.cross-sell.recommendation', pattern:'cross-sell.recommendation', html:'<div id="sims-fbt">Buy it with</div>', selector:'#sims-fbt', requested:'collapse', applied:'collapse' },
    { detector:'amazon.service.promo', pattern:'upsell.amazon-service', html:'<div id="audible-promo">Audible</div>', selector:'#audible-promo', requested:'collapse', applied:'collapse' },
    { detector:'amazon.ai.rufus', pattern:'pressure.shopping-assistant', html:'<div id="rufus-container">Rufus</div>', selector:'#rufus-container', requested:'collapse', applied:'dim' }
  ];

  for (const fixture of fixtures) {
    const page = await amazonPage(browser, fixture.html);
    const result = await page.evaluate(({ selector }) => {
      EXP.Engine.start();
      const node = document.querySelector(selector);
      const audit = EXP.Audit.snapshot();
      const target = audit.targets.find((item) => item.detections.some((detection) => detection.detectorId));
      return {
        hidden: node.hidden,
        action: node.dataset.wardAction || '',
        audit,
        target
      };
    }, { selector: fixture.selector });

    const detection = result.target.detections.find((item) => item.detectorId === fixture.detector);
    assert.ok(detection, fixture.detector);
    assert.equal(detection.patternId, fixture.pattern, fixture.detector);
    assert.equal(result.target.requestedAction, fixture.requested, fixture.detector);
    assert.equal(result.target.appliedAction, fixture.applied, fixture.detector);
    assert.equal(result.action, fixture.applied === 'allow' ? '' : fixture.applied, fixture.detector);
    assert.equal(result.audit.counts.detected >= 1, true, fixture.detector);
    await page.close();
  }
});

test('audit reports duplicate detector targeting without counting repeat scans as new detections', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await amazonPage(browser, '<div id="businessPrimeDPUpsellStaticContainer">Shared target</div>');

  const result = await page.evaluate(() => {
    EXP.Engine.start();
    EXP.Engine.processBatch([document]);
    EXP.Engine.processBatch([document]);
    const audit = EXP.Audit.snapshot();
    const target = audit.targets[0];
    return {
      counts: audit.counts,
      detectors: target.detections.map((item) => item.detectorId).sort(),
      interventions: EXP.Activity.snapshot().totals.interventions
    };
  });

  assert.equal(result.counts.duplicateTargets, 1);
  assert.deepEqual(result.detectors, ['amazon.business.promo','amazon.prime.product']);
  assert.equal(result.counts.detected, 2);
  assert.equal(result.counts.acted, 1);
  assert.equal(result.interventions, 1);
});

test('interventions preserve surrounding content and reveal/disable restore the target', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await amazonPage(browser, '<div id="primeDPUpsellStaticContainerNPA"><button>Prime</button></div>');

  const result = await page.evaluate(() => {
    EXP.Engine.start();
    const target = document.querySelector('#primeDPUpsellStaticContainerNPA');
    const parent = document.querySelector('#fixture-parent');
    const before = document.querySelector('#before');
    const after = document.querySelector('#after');
    const id = EXP.Actions.snapshot()[0].id;
    const initial = {
      targetHidden: target.hidden,
      parentHidden: parent.hidden,
      beforeHidden: before.hidden,
      afterHidden: after.hidden,
      parentAction: parent.dataset.wardAction || '',
      siblingActions: [before.dataset.wardAction || '', after.dataset.wardAction || '']
    };
    EXP.Actions.reveal(id);
    const revealed = {
      hidden: target.hidden,
      revealed: target.dataset.wardRevealed,
      audit: EXP.Audit.snapshot().counts
    };
    EXP.Settings.update({ enabled:false });
    EXP.Engine.rebuild();
    const disabled = {
      hidden: target.hidden,
      action: target.dataset.wardAction || '',
      companion: target.nextElementSibling?.className || ''
    };
    return { initial, revealed, disabled };
  });

  assert.deepEqual(result.initial, {
    targetHidden:true,
    parentHidden:false,
    beforeHidden:false,
    afterHidden:false,
    parentAction:'',
    siblingActions:['','']
  });
  assert.equal(result.revealed.hidden, false);
  assert.equal(result.revealed.revealed, '1');
  assert.equal(result.revealed.audit.revealed, 1);
  assert.deepEqual(result.disabled, { hidden:false, action:'', companion:'' });
});

test('policy skips and structural downgrades are separated in audit counters', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());

  const skippedPage = await amazonPage(browser, '<div id="dealBadge_feature_div">Deal</div>');
  const skipped = await skippedPage.evaluate(() => {
    EXP.Settings.update({ patterns:{'pressure.urgency':'off'} });
    EXP.Engine.start();
    return EXP.Audit.snapshot();
  });
  assert.equal(skipped.counts.detected, 1);
  assert.equal(skipped.counts.skipped, 1);
  assert.equal(skipped.counts.acted, 0);
  assert.equal(skipped.targets[0].reason, 'pattern-disabled');
  await skippedPage.close();

  const downgradedPage = await amazonPage(browser, '<div id="rufus-container">Rufus</div>');
  const downgraded = await downgradedPage.evaluate(() => {
    EXP.Engine.start();
    return EXP.Audit.snapshot();
  });
  assert.equal(downgraded.counts.downgraded, 1);
  assert.equal(downgraded.counts.structuralCollapseSkipped, 1);
  assert.equal(downgraded.targets[0].requestedAction, 'collapse');
  assert.equal(downgraded.targets[0].appliedAction, 'dim');
  assert.equal(downgraded.targets[0].reason, 'dynamic-widget');
});

test('navigation resets the current-page audit map', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await amazonPage(browser, '<div id="primeDPUpsellStaticContainerNPA">Prime</div>');

  const result = await page.evaluate(() => {
    EXP.Engine.start();
    const before = EXP.Audit.snapshot();
    history.pushState({}, '', '/s?k=next');
    document.querySelector('#primeDPUpsellStaticContainerNPA')?.remove();
    EXP.Engine.navigation();
    const after = EXP.Audit.snapshot();
    return { before:before.counts, after:after.counts, targets:after.targets.length };
  });

  assert.equal(result.before.detected, 1);
  assert.equal(result.after.detected, 0);
  assert.equal(result.targets, 0);
});

test('diagnostics audit excludes page text, form values, selectors, markup, and URL paths', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const secretText = 'PRIVATE_PRODUCT_TEXT_91f0';
  const secretValue = 'PRIVATE_FORM_VALUE_c71a';
  const secretPath = 'PRIVATE_PATH_2d3e';
  const page = await amazonPage(
    browser,
    `<div id="primeDPUpsellStaticContainerNPA">${secretText}</div><input value="${secretValue}">`,
    `/dp/${secretPath}?token=${secretValue}`
  );

  const serialized = await page.evaluate(() => {
    EXP.Engine.start();
    return JSON.stringify(EXP.Diagnostics.createDiagnosticsReport('WARD', EXP.Engine.diagnostics()));
  });

  assert.doesNotMatch(serialized, /PRIVATE_PRODUCT_TEXT_91f0/);
  assert.doesNotMatch(serialized, /PRIVATE_FORM_VALUE_c71a/);
  assert.doesNotMatch(serialized, /PRIVATE_PATH_2d3e/);
  assert.doesNotMatch(serialized, /primeDPUpsellStaticContainerNPA/);
  assert.doesNotMatch(serialized, /<div|outerHTML|innerHTML/);
  assert.match(serialized, /amazon\.prime\.product/);
  assert.match(serialized, /upsell\.membership\.prime/);
  assert.match(serialized, /requestedAction/);
  assert.match(serialized, /appliedAction/);
});


test('Essential, Balanced, and Custom choose distinct policy actions', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());

  const evaluateLevel = async (level, defaultAction = 'collapse') => {
    const page = await amazonPage(browser, '<div id="protectionPlan_feature_div">Plan</div>');
    const result = await page.evaluate(({ level, defaultAction }) => {
      EXP.Settings.update({ protectionLevel:level, defaultAction });
      EXP.Engine.start();
      const audit = EXP.Audit.snapshot();
      const node = document.querySelector('#protectionPlan_feature_div');
      return {
        action: node.dataset.wardAction || '',
        reason: audit.targets[0]?.reason || '',
        requested: audit.targets[0]?.requestedAction || ''
      };
    }, { level, defaultAction });
    await page.close();
    return result;
  };

  assert.deepEqual(await evaluateLevel('essential'), { action:'dim', reason:'essential-dim', requested:'dim' });
  assert.deepEqual(await evaluateLevel('balanced'), { action:'collapse', reason:'balanced-pattern-policy', requested:'collapse' });
  assert.deepEqual(await evaluateLevel('custom','annotate'), { action:'annotate', reason:'custom-policy', requested:'annotate' });
});

test('temporary reveal survives ordinary rescans until explicitly ended', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await amazonPage(browser, '<div id="primeDPUpsellStaticContainerNPA">Prime</div>');

  const result = await page.evaluate(() => {
    EXP.Engine.start();
    const node = document.querySelector('#primeDPUpsellStaticContainerNPA');
    const id = EXP.Actions.snapshot()[0].id;
    EXP.Actions.reveal(id);
    EXP.Engine.processBatch([document]);
    EXP.Engine.processBatch([document]);
    const during = {
      hidden: node.hidden,
      dimmed: node.classList.contains('exp-ward-dimmed'),
      companion: node.nextElementSibling?.className || '',
      revealed: node.dataset.wardRevealed || '',
      record: EXP.Actions.snapshot().find((item) => item.id === id)?.revealed,
      auditRevealed: EXP.Audit.snapshot().counts.revealed
    };
    EXP.Actions.endReveal(id);
    const after = {
      hidden: node.hidden,
      action: node.dataset.wardAction || '',
      revealed: node.dataset.wardRevealed || '',
      auditRevealed: EXP.Audit.snapshot().counts.revealed
    };
    return { during, after };
  });

  assert.deepEqual(result.during, {
    hidden:false,
    dimmed:false,
    companion:'exp-ward-reprotect',
    revealed:'1',
    record:true,
    auditRevealed:1
  });
  assert.equal(result.after.revealed, '');
  assert.equal(result.after.auditRevealed, 0);
  assert.notEqual(result.after.action, '');
});

test('audit updates the latest decision when a target changes structural safety', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await amazonPage(browser, '<div id="sims-fbt">Recommendations</div>');

  const result = await page.evaluate(() => {
    EXP.Settings.update({ protectionLevel:'balanced', recommendationCleanup:true });
    EXP.Engine.start();
    const node = document.querySelector('#sims-fbt');
    const before = EXP.Audit.snapshot().targets[0];
    const video = document.createElement('video');
    node.append(video);
    EXP.Engine.processBatch([document]);
    const after = EXP.Audit.snapshot().targets[0];
    return {
      before:{ requested:before.requestedAction, applied:before.appliedAction, safe:before.structuralSafe },
      after:{
        requested:after.requestedAction,
        applied:after.appliedAction,
        safe:after.structuralSafe,
        reason:after.reason,
        decisions:after.decisions
      },
      node:{ hidden:node.hidden, action:node.dataset.wardAction || '' }
    };
  });

  assert.deepEqual(result.before, { requested:'collapse', applied:'collapse', safe:true });
  assert.equal(result.after.requested, 'collapse');
  assert.equal(result.after.applied, 'dim');
  assert.equal(result.after.safe, false);
  assert.equal(result.after.reason, 'dynamic-widget');
  assert.equal(result.after.decisions.length, 1);
  assert.deepEqual(result.node, { hidden:false, action:'dim' });
});

test('audit prunes disconnected targets', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await amazonPage(browser, '<div id="dealBadge_feature_div">Deal</div>');

  const result = await page.evaluate(() => {
    EXP.Engine.start();
    const before = EXP.Audit.snapshot();
    document.querySelector('#dealBadge_feature_div').remove();
    EXP.Engine.processBatch([document]);
    const after = EXP.Audit.snapshot();
    return { before:before.targets.length, after:after.targets.length, detected:after.counts.detected };
  });

  assert.equal(result.before, 1);
  assert.equal(result.after, 0);
  assert.equal(result.detected, 0);
});

test('recommendation cleanup is represented by the same audited policy path', async (t) => {
  const browser = await chromium.launch({ headless: true });
  t.after(() => browser.close());
  const page = await amazonPage(browser, '<div id="sims-fbt">Recommendations</div>');

  const result = await page.evaluate(() => {
    EXP.Settings.update({ protectionLevel:'essential', recommendationCleanup:true });
    EXP.Engine.start();
    const target = EXP.Audit.snapshot().targets[0];
    const node = document.querySelector('#sims-fbt');
    return {
      requested:target.requestedAction,
      applied:target.appliedAction,
      reason:target.reason,
      hidden:node.hidden,
      action:node.dataset.wardAction || ''
    };
  });

  assert.deepEqual(result, {
    requested:'collapse',
    applied:'collapse',
    reason:'recommendation-cleanup',
    hidden:true,
    action:'collapse'
  });
});

test('explicit Custom Dim action takes precedence over recommendation cleanup', async (t) => {
  const browser = await chromium.launch({ headless:true }); t.after(() => browser.close());
  const page = await amazonPage(browser, '<div id="sims-fbt">Recommendations</div>');
  const result = await page.evaluate(() => {
    EXP.Settings.update({ protectionLevel:'custom', defaultAction:'dim', recommendationCleanup:true });
    EXP.Engine.start();
    const node = document.querySelector('#sims-fbt');
    return { hidden:node.hidden, action:node.dataset.wardAction, reason:EXP.Audit.snapshot().targets[0].reason };
  });
  assert.deepEqual(result,{ hidden:false, action:'dim', reason:'custom-policy' });
});

test('global Hide and Dim apply across protection levels while retaining safety and opt-outs', async (t) => {
  const browser = await chromium.launch({ headless:true }); t.after(() => browser.close());
  const page = await amazonPage(browser, '<div id="ad" data-component-type="s-sponsored-result">Ad</div><div id="sims-fbt">Recommendations</div><div id="primeDPUpsellStaticContainerNPA">Prime</div><div id="rufus-container">Dynamic assistant</div><div id="buybox"><div id="businessPrimeDPUpsellStaticContainer">Delivery</div></div>');
  for (const level of ['essential','balanced','custom']) {
    const result = await page.evaluate(level => {
      EXP.Settings.update({protectionLevel:level,contentAction:'dim',recommendationCleanup:true}); EXP.Engine.start(); EXP.Engine.rebuild();
      const state = id => { const n=document.getElementById(id); return {hidden:n.hidden,action:n.dataset.wardAction}; };
      const ids=['ad','sims-fbt','primeDPUpsellStaticContainerNPA'];
      const dim=ids.map(state);
      EXP.Settings.update({contentAction:'hide'}); EXP.Engine.rebuild();
      const hide=ids.map(state);
      const safe=[state('rufus-container'),state('businessPrimeDPUpsellStaticContainer')];
      EXP.Settings.update({categories:{sponsored:'off'}}); EXP.Engine.rebuild();
      const off=state('ad');
      EXP.Settings.update({categories:{},contentAction:'automatic'}); EXP.Engine.rebuild();
      return {dim,hide,safe,off};
    },level);
    assert.deepEqual(result.dim,Array(3).fill({hidden:false,action:'dim'}),level);
    assert.deepEqual(result.hide,Array(3).fill({hidden:true,action:'hide'}),level);
    assert.deepEqual(result.safe,[{hidden:false,action:'dim'},{hidden:false,action:'annotate'}],level);
    assert.deepEqual(result.off,{hidden:false,action:undefined},level);
  }
});

test('content action defaults migrate safely and the preference survives storage and export/import', async (t) => {
  const browser = await chromium.launch({headless:true}); t.after(() => browser.close());
  const page=await amazonPage(browser,'<div>Product</div>');
  const result=await page.evaluate(() => {
    const old=EXP.Settings.validate({protectionLevel:'custom',defaultAction:'annotate'});
    const invalid=EXP.Settings.validate({contentAction:'remove-everything'});
    EXP.Settings.update({contentAction:'dim'});
    const stored=EXP.Settings.load().contentAction;
    const exported=EXP.Settings.exportData();
    EXP.Settings.update({contentAction:'hide'});
    EXP.Settings.replace(EXP.Settings.prepareImport(exported));
    return {old:old.contentAction,oldAction:old.defaultAction,invalid:invalid.contentAction,stored,imported:EXP.Settings.snapshot().contentAction};
  });
  assert.deepEqual(result,{old:'automatic',oldAction:'annotate',invalid:'automatic',stored:'dim',imported:'dim'});
});
