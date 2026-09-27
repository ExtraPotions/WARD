'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
test('System width selector resizes the menu and persists across page loads',async t=>{
 const browser=await chromium.launch();t.after(()=>browser.close());const page=await browser.newPage({viewport:{width:1000,height:900}});
 await page.route('**/*',r=>r.request().isNavigationRequest()?r.fulfill({contentType:'text/html',body:'<main>Product fixture</main>'}):r.abort());
 const source=fs.readFileSync(path.join(__dirname,'../ward.user.js'),'utf8');
 async function boot(){await page.addScriptTag({content:source});await page.locator('#exp-ward-root').waitFor({state:'attached'});await page.locator('#exp-ward-root .ward-launcher').click();await page.locator('#exp-ward-root [data-view=system]').click();}
 await page.goto('https://www.amazon.com/dp/fixture');await boot();
 for(const [mode,width] of [['full',312],['compact',260],['narrow',220]]){
  await page.getByRole('combobox',{name:'Panel + menu width',exact:true}).selectOption(mode);
  await page.waitForFunction(width=>Math.abs(document.querySelector('#exp-ward-root').shadowRoot.querySelector('[data-exp-part=dock]').getBoundingClientRect().width-width)<1,width);
  await page.reload();await boot();
  assert.equal(await page.getByRole('combobox',{name:'Panel + menu width',exact:true}).inputValue(),mode);
  await page.waitForFunction(width=>Math.abs(document.querySelector('#exp-ward-root').shadowRoot.querySelector('[data-exp-part=dock]').getBoundingClientRect().width-width)<1,width);
 }
 await page.setViewportSize({width:240,height:480});await page.getByRole('combobox',{name:'Panel + menu width',exact:true}).selectOption('full');await page.waitForTimeout(100);
 const box=await page.locator('#exp-ward-root [data-exp-part=dock]').boundingBox();assert.ok(box.x>=8&&box.x+box.width<=232);
});
