'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
test('protection review keeps full-width type choices and working review actions at all menu widths',async t=>{
 const browser=await chromium.launch();t.after(()=>browser.close());const page=await browser.newPage({viewport:{width:820,height:1180},hasTouch:true});await page.addInitScript({content:require('./manager-storage.cjs')});
 await page.route('**/*',r=>r.request().isNavigationRequest()?r.fulfill({contentType:'text/html',body:'<!doctype html><main><div id="rufus-container">Shopping assistant</div></main>'}):r.abort());
 await page.goto('https://www.amazon.com/dp/sample');await page.addScriptTag({content:fs.readFileSync(path.join(__dirname,'../ward.user.js'),'utf8')});const host=page.locator('#exp-ward-root');await host.locator('[data-exp-part=launcher]').click();
 for(const [size,width]of [['standard',324],['compact',304],['mini',280]]){
  await page.evaluate(size=>{GM_setValue('exp:suite:menu-size',size);localStorage.setItem('exp:suite:menu-size',size);document.dispatchEvent(new CustomEvent('exp-core:menu-size',{detail:size}));},size);
  await page.waitForFunction(width=>Math.abs(document.querySelector('#exp-ward-root').shadowRoot.querySelector('[data-exp-part=dock]').getBoundingClientRect().width-width)<.1,width);
  const card=host.locator('[data-ward-review]');if(!await card.evaluate(n=>n.open))await card.locator(':scope>summary').click();
  const choice=card.getByRole('combobox',{name:'Missed protection type'});await choice.selectOption({label:'Prime membership promotion'});
  const facts=await card.evaluate(n=>{const s=n.querySelector('select'),face=s.parentElement,r=face.getBoundingClientRect();return{width:n.closest('[data-exp-part=dock]').getBoundingClientRect().width,height:n.getBoundingClientRect().height,choiceWidth:r.width,available:n.clientWidth,paragraphs:n.querySelectorAll('p').length,overflow:n.scrollWidth-n.clientWidth};});
  assert.equal(facts.width,width);assert.equal(facts.paragraphs,0);assert(facts.choiceWidth>facts.available-20);assert(facts.height<300);assert(facts.overflow<=1);
 }
 await host.getByRole('button',{name:'Correct',exact:true}).click();await host.getByRole('button',{name:'Record',exact:true}).click();
 const saved=await page.evaluate(()=>GM_getValue('exp:v3:ward:settings',{}).protectionReviews);assert.deepEqual(saved.map(r=>r.verdict),['correct','missed']);assert.equal(saved[1].patternId,'upsell.membership.prime');
});
