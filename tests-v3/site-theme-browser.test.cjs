'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright');
const source=require('../scripts/build.cjs').assembleSource().readable.replace('EXP.App.start();','window.__ward=EXP;EXP.App.start();');
const stores=[['amazon','https://www.amazon.com/dp/fixture'],['walmart','https://www.walmart.com/ip/fixture/1'],['ebay','https://www.ebay.com/itm/123'],['etsy','https://www.etsy.com/listing/123/fixture'],['target','https://www.target.com/p/fixture/-/A-123'],['bestbuy','https://www.bestbuy.com/site/fixture/123.p'],['shopify','https://fixture-store.example/products/fixture']];
test('Obsidian site theme works across every retailer, persists, restores and leaves photos and purchasing available',async t=>{
 const browser=await chromium.launch();t.after(()=>browser.close());
 for(const [store,url]of stores){
  const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><head><style>body{background:rgb(255,255,255);color:#111}main{background:white}button,input{background:white;color:#111}</style></head><body><script id="shopify-features" type="application/json">{}</script><main><h1>Sample product</h1><p>Product details</p><img id="photo" alt="Product" src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22%3E%3Crect width=%2280%22 height=%2280%22 fill=%22red%22/%3E%3C/svg%3E"><button id="buy">Add to cart</button><input placeholder="Search store"><div id="later"></div></main></body></html>'}));
  await page.goto(url);
  await page.route('**/ward-launcher.svg',r=>r.fulfill({path:path.resolve(__dirname,'../assets/ward-launcher.svg'),contentType:'image/svg+xml'}));
  await page.evaluate(()=>{const data=new Map();window.GM_getValue=(k,d)=>data.has(k)?data.get(k):d;window.GM_setValue=(k,v)=>data.set(k,v);window.GM_xmlhttpRequest=()=>{};window.__values=data;document.querySelector('#buy').onclick=()=>window.__bought=true;});
  await page.addScriptTag({content:source});await page.waitForFunction(()=>window.__ward?.App.lifecycle?.state==='enabled');
  assert.equal(await page.evaluate(()=>__ward.Retailer.key()),store);
  assert.equal(await page.locator('html').getAttribute('data-exp-ward-site-theme'),null);
  const photo=await page.locator('#photo').getAttribute('src');
  await page.evaluate(()=>__ward.Settings.update({siteDarkMode:true}));
  assert.equal(await page.locator('body').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(3, 6, 10)');
  assert.equal(await page.locator('input').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(26, 37, 48)');
  assert.equal(await page.locator('#photo').evaluate(n=>getComputedStyle(n).filter),'none');assert.equal(await page.locator('#photo').getAttribute('src'),photo);
  await page.evaluate(()=>document.querySelector('#later').innerHTML='<article id="dynamic">Later results</article>');
  assert.equal(await page.locator('#dynamic').evaluate(n=>getComputedStyle(n).color),'rgb(201, 215, 223)');
  await page.locator('#buy').click();assert.equal(await page.evaluate(()=>__bought),true);
  assert.equal(await page.evaluate(()=>__values.get('exp:v3:ward:settings').siteDarkMode),true);
  await page.evaluate(()=>{__ward.UI.open();});
  await page.locator('#exp-ward-root').getByRole('tab',{name:'Look',exact:true}).click();
  const toggle=page.locator('#exp-ward-root').getByRole('switch',{name:'Site dark mode',exact:true});
  await toggle.focus();await page.keyboard.press('Space');
  assert.equal(await page.locator('html').getAttribute('data-exp-ward-site-theme'),null);
  assert.equal(await page.locator('body').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(255, 255, 255)');
  await toggle.click();await page.evaluate(()=>__ward.Settings.update({safeMode:true}));
  assert.equal(await page.locator('html').getAttribute('data-exp-ward-site-theme'),null);
  await page.evaluate(()=>__ward.Settings.update({safeMode:false}));
  assert.equal(await page.locator('html').getAttribute('data-exp-ward-site-theme'),'obsidian');
  if(store==='amazon'){const out=path.resolve(__dirname,'../../local-verification/ward-thread-20261020');fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,'ward-dark-mobile.png')});}
  await page.evaluate(()=>__ward.Settings.update({retailers:{...__ward.Settings.snapshot().retailers,[__ward.Retailer.key()]:false}}));
  assert.equal(await page.locator('html').getAttribute('data-exp-ward-site-theme'),null);
  assert.deepEqual(errors,[]);await page.close();
 }
});
