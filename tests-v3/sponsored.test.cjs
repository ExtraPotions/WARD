'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const modules = ['core.js','settings.js','patterns.js','audit.js','retailers.js','amazon-adapter.js','walmart-adapter.js','ebay-adapter.js','etsy-adapter.js','activity.js','page-styles.js','actions.js','layout.js','engine.js'];
const runtime = `${fs.readFileSync(path.join(root,'vendor/exp-core/exp-core.js'),'utf8')}\nconst EXP={};${modules.map(name => fs.readFileSync(path.join(root,'src',name),'utf8')).join('\n')}window.EXP=EXP;`;
// Reduced from the supplied Amazon product-page DOM; no personal data or ad URLs.
const ads = `
<div data-feature-name="desktop-dp-ilm"><div class="ape-placement" id="ape_Detail_desktop-detail-ilm_desktop_placement"><iframe title="Sponsored ad"></iframe><span>Sponsored</span></div></div>
<div class="ape-wrapper" id="ape_Detail_customer-reviews-top_Glance_wrapper"><div class="ape-placement" id="ape_Detail_customer-reviews-top_Glance_placement">Creative</div><span>Sponsored</span></div>
<div id="sp_detail_thematic-highly_rated" class="a-carousel-container" data-a-carousel-options="{}"><h2>Sponsored products</h2><ol class="a-carousel"><li>Ad</li></ol></div>
<div id="sp_detail2" class="a-carousel-container" data-a-carousel-options="{}"><h2>Sponsored products</h2><ol class="a-carousel"><li>Ad</li></ol></div>
<ul><li class="dpx-smidget-desktop-pill-list-item" id="paid-question"><span><button data-action-id="related_questions_sponsored_related_question_invoke_nile_backend_api_1_0">Sponsored question</button></span></li><li id="organic-question"><button>Product question</button></li></ul>
<div data-component-type="s-sponsored-result" id="search-ad">Sponsored result</div>`;
const targets = ['ape_Detail_desktop-detail-ilm_desktop_placement','ape_Detail_customer-reviews-top_Glance_wrapper','sp_detail_thematic-highly_rated','sp_detail2','paid-question','search-ad'];
async function setup(t, html = ads) {
  const browser = await chromium.launch({headless:true}); t.after(() => browser.close());
  const page = await browser.newPage();
  await page.route('**/*', r => r.request().isNavigationRequest() && r.request().frame() === page.mainFrame()
    ? r.fulfill({contentType:'text/html',body:`<!doctype html><html><body><main id="product"><h1>Product</h1><div id="buybox"><button>Buy</button></div>${html}<div id="organic" class="a-carousel-container"><video></video>Organic recommendations</div></main></body></html>`}) : r.abort());
  await page.goto('https://www.amazon.com/dp/test');
  await page.addScriptTag({content:runtime});
  await page.evaluate(() => { EXP.Settings.load(); EXP.Settings.update({autoClipCoupons:false}); });
  return page;
}
test('complete sponsored placements hide by default and restore without hiding product content', async t => {
  const page = await setup(t);
  const result = await page.evaluate(ids => {
    EXP.Engine.start();
    const hidden = ids.map(id => { const n=document.getElementById(id); return {id,hidden:n.hidden,display:getComputedStyle(n).display,action:n.dataset.wardAction}; });
    const preserved = ['product','buybox','organic','organic-question'].every(id => { const n=document.getElementById(id); return !n.hidden && !n.hasAttribute('data-ward-action'); });
    const nestedTracked = document.querySelector('#ape_Detail_customer-reviews-top_Glance_placement').hasAttribute('data-ward-instance');
    const record = EXP.Actions.snapshot().find(r => r.patternId === 'sponsorship.placement');
    EXP.Actions.reveal(record.id); const revealed = document.querySelector(`[data-ward-instance="${record.id}"]`).hidden === false;
    EXP.Engine.processBatch([document]); const stillRevealed = document.querySelector(`[data-ward-instance="${record.id}"]`).hidden === false;
    EXP.Engine.stop();
    return {hidden,preserved,nestedTracked,revealed,stillRevealed,restored:ids.every(id => !document.getElementById(id).hidden)};
  }, targets);
  assert.deepEqual(result.hidden,targets.map(id => ({id,hidden:true,display:'none',action:'hide'})));
  assert.equal(result.preserved,true); assert.equal(result.nestedTracked,false);
  assert.equal(result.revealed,true); assert.equal(result.stillRevealed,true); assert.equal(result.restored,true);
});
test('late ad content is detected when the placement itself is the incremental scan root', async t => {
  const page = await setup(t,'<div id="ape_Detail_late_desktop_placement" class="ape-placement"></div>');
  const result = await page.evaluate(() => {
    EXP.Engine.start();
    const ad=document.getElementById('ape_Detail_late_desktop_placement');
    ad.innerHTML='<iframe title="Sponsored ad"></iframe><span>Sponsored</span>';
    EXP.Engine.processBatch([ad]);
    return {hidden:ad.hidden,action:ad.dataset.wardAction,detected:EXP.AmazonAdapter.detect([ad]).some(e => e.node===ad)};
  });
  assert.deepEqual(result,{hidden:true,action:'hide',detected:true});
});

test('live Amazon AdHolder results and sponsored brand cards respect hide, dim and restore', async t => {
  const page=await setup(t,`<div class="s-result-item s-asin AdHolder" data-component-type="s-search-result" id="paid-result"><span class="puis-sponsored-label-text">Sponsored</span><h2>Paid product</h2></div>
    <div class="s-result-item s-widget AdHolder" id="paid-brand"><div class="sb-desktop"><span>Sponsored</span><h2>Paid brand</h2></div></div>
    <div class="s-result-item s-asin" data-component-type="s-search-result" id="organic-result"><h2>Organic product</h2></div>`);
  await page.evaluate(()=>history.replaceState(null,'','/s?k=test'));
  const result=await page.evaluate(async ()=>{
    EXP.Engine.start();
    const ids=['paid-result','paid-brand'];
    const hidden=ids.map(id=>document.getElementById(id).hidden);
    const organic=document.getElementById('organic-result');
    const organicUntouched=!organic.hidden&&!organic.hasAttribute('data-ward-action');
    EXP.Settings.update({contentAction:'dim'});EXP.Engine.rebuild();
    // The dim fades in over 120 ms; wait for it to settle rather than for a fixed time.
    const settled=()=>ids.every(id=>getComputedStyle(document.getElementById(id)).opacity==='0.58');
    for(const started=performance.now();!settled()&&performance.now()-started<2000;)await new Promise(resolve=>setTimeout(resolve,20));
    const dimmed=ids.map(id=>{const n=document.getElementById(id);return {hidden:n.hidden,action:n.dataset.wardAction,opacity:getComputedStyle(n).opacity};});
    EXP.Engine.stop();
    return {hidden,organicUntouched,dimmed,restored:ids.every(id=>!document.getElementById(id).hidden&&!document.getElementById(id).hasAttribute('data-ward-action'))};
  });
  assert.deepEqual(result.hidden,[true,true]);
  assert.equal(result.organicUntouched,true);
  assert.deepEqual(result.dimmed,[{hidden:false,action:'dim',opacity:'0.58'},{hidden:false,action:'dim',opacity:'0.58'}]);
  assert.equal(result.restored,true);
});
test('sponsored policy still respects disabled categories, essential controls and page landmarks', async t => {
  const page=await setup(t,`${ads}<div class="ape-placement" id="ape_Detail_mixed_desktop_placement"><div id="price">Price</div></div><div class="ape-placement" id="ape_Detail_shell_desktop_placement"><div role="main">Essential page</div></div>`);
  const result=await page.evaluate(ids => {
    EXP.Engine.start();
    const mixed=document.getElementById('ape_Detail_mixed_desktop_placement');
    const shell=document.getElementById('ape_Detail_shell_desktop_placement');
    const safety={mixedHidden:mixed.hidden,mixedAction:mixed.dataset.wardAction,shellHidden:shell.hidden,shellAction:shell.dataset.wardAction || ''};
    EXP.Settings.update({categories:{...EXP.Settings.snapshot().categories,sponsored:'off'}}); EXP.Engine.rebuild();
    return {safety,disabled:ids.every(id => !document.getElementById(id).hidden)};
  },targets);
  assert.deepEqual(result.safety,{mixedHidden:false,mixedAction:'annotate',shellHidden:false,shellAction:''});
  assert.equal(result.disabled,true);
});

test('hero quick promo ad unit with sibling feedback disclosure hides cleanly and never flashes on incremental child mutations', async t => {
  const hqpAd = `
<div id="hqpWrapper" class="centerColAlign">
  <div id="heroQuickPromoContainer" class="celwidget" data-feature-name="heroQuickPromoContainer">
    <hr aria-hidden="true" class="a-spacing-medium a-divider-normal"/>
    <div id="heroQuickPromo_feature_div" class="celwidget" data-feature-name="heroQuickPromo">
      <div id="ape_Detail_hero-quick-promo_Desktop_test_placement" class="text/x-dacx-safeframe ape-placement">
        <iframe title="Sponsored ad"></iframe>
      </div>
      <div id="ape_Detail_hero-quick-promo_Desktop_test_placement_Feedback" class="ape-feedback">
        <a id="af-label-primary-link-hero-quick-promo" aria-label="Leave feedback on Sponsored ad">
          <span id="ad-feedback-text-hero-quick-promo">Sponsored</span>
        </a>
      </div>
    </div>
  </div>
</div>`;
  const page = await setup(t, hqpAd);
  const result = await page.evaluate(() => {
    EXP.Engine.start();
    const wrapper = document.getElementById('hqpWrapper');
    const placement = document.getElementById('ape_Detail_hero-quick-promo_Desktop_test_placement');
    const feedback = document.getElementById('ape_Detail_hero-quick-promo_Desktop_test_placement_Feedback');
    const container = document.getElementById('heroQuickPromoContainer');

    const initialHidden = wrapper.hidden && wrapper.dataset.wardAction === 'hide';

    // Simulate late SafeFrame mutations inside placement and feedback
    placement.innerHTML = '<iframe title="Updated ad"></iframe>';
    EXP.Engine.processBatch([placement]);
    const afterPlacementBatch = wrapper.hidden && !placement.hasAttribute('data-ward-action');

    feedback.innerHTML = '<a id="af-label-primary-link-hero-quick-promo"><span>Updated Sponsored</span></a>';
    EXP.Engine.processBatch([feedback]);
    const afterFeedbackBatch = wrapper.hidden && !feedback.hasAttribute('data-ward-action');

    // Simulate mutation on container
    container.setAttribute('data-updated', '1');
    EXP.Engine.processBatch([container]);
    const afterContainerBatch = wrapper.hidden;

    EXP.Engine.stop();
    const restored = !wrapper.hidden && !wrapper.hasAttribute('data-ward-action');

    return { initialHidden, afterPlacementBatch, afterFeedbackBatch, afterContainerBatch, restored };
  });

  assert.deepEqual(result, {
    initialHidden: true,
    afterPlacementBatch: true,
    afterFeedbackBatch: true,
    afterContainerBatch: true,
    restored: true
  });
});

test('hero quick promo without hqpWrapper hides heroQuickPromoContainer and remains intact on child mutations', async t => {
  const hqpAd = `
<div id="heroQuickPromoContainer" class="celwidget" data-feature-name="heroQuickPromoContainer">
  <div id="heroQuickPromo_feature_div" class="celwidget" data-feature-name="heroQuickPromo">
    <div id="ape_Detail_hero-quick-promo_Desktop_test2_placement" class="text/x-dacx-safeframe ape-placement">
      <iframe title="Sponsored ad"></iframe>
    </div>
    <div id="ape_Detail_hero-quick-promo_Desktop_test2_placement_Feedback" class="ape-feedback">
      <a id="af-label-primary-link-hero-quick-promo"><span>Sponsored</span></a>
    </div>
  </div>
</div>`;
  const page = await setup(t, hqpAd);
  const result = await page.evaluate(() => {
    EXP.Engine.start();
    const container = document.getElementById('heroQuickPromoContainer');
    const placement = document.getElementById('ape_Detail_hero-quick-promo_Desktop_test2_placement');
    const feedback = document.getElementById('ape_Detail_hero-quick-promo_Desktop_test2_placement_Feedback');

    const initialHidden = container.hidden && container.dataset.wardAction === 'hide';

    placement.innerHTML = '<iframe title="Updated ad"></iframe>';
    EXP.Engine.processBatch([placement]);
    const afterPlacementBatch = container.hidden && !placement.hasAttribute('data-ward-action');

    feedback.innerHTML = '<a id="af-label-primary-link-hero-quick-promo"><span>Updated Sponsored</span></a>';
    EXP.Engine.processBatch([feedback]);
    const afterFeedbackBatch = container.hidden && !feedback.hasAttribute('data-ward-action');

    EXP.Engine.stop();
    const restored = !container.hidden && !container.hasAttribute('data-ward-action');

    return { initialHidden, afterPlacementBatch, afterFeedbackBatch, restored };
  });

  assert.deepEqual(result, {
    initialHidden: true,
    afterPlacementBatch: true,
    afterFeedbackBatch: true,
    restored: true
  });
});
