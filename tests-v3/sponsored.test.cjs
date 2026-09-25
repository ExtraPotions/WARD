'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const modules = ['core.js','settings.js','patterns.js','audit.js','amazon-adapter.js','activity.js','page-styles.js','actions.js','layout.js','engine.js'];
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
