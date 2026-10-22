'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright');
const source=require('../scripts/build.cjs').assembleSource().readable.replace('EXP.App.start();','window.__ward=EXP;EXP.App.start();');
const stores=[['amazon','https://www.amazon.com/dp/fixture'],['walmart','https://www.walmart.com/ip/fixture/1'],['ebay','https://www.ebay.com/itm/123'],['etsy','https://www.etsy.com/listing/123/fixture'],['target','https://www.target.com/p/fixture/-/A-123'],['bestbuy','https://www.bestbuy.com/site/fixture/123.p'],['shopify','https://fixture-store.example/products/fixture']];
test('site colors (Obsidian and Core palettes) work across every retailer, persist, restore and leave photos and purchasing available',async t=>{
 const browser=await chromium.launch();t.after(()=>browser.close());
 for(const [store,url]of stores){
  const page=await browser.newPage({viewport:{width:390,height:844}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><head><style>body{background:rgb(255,255,255);color:#111}main{background:white}button,input{background:white;color:#111}</style></head><body><script id="shopify-features" type="application/json">{}</script><main><h1>Sample product</h1><p>Product details</p><img id="photo" alt="Product" src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22%3E%3Crect width=%2280%22 height=%2280%22 fill=%22red%22/%3E%3C/svg%3E"><button id="buy">Add to cart</button><input placeholder="Search store"><div id="later"></div></main></body></html>'}));
  await page.goto(url);
  await page.route('**/ward-launcher.svg',r=>r.fulfill({path:path.resolve(__dirname,'../assets/ward-launcher.svg'),contentType:'image/svg+xml'}));
  await page.evaluate(()=>{const data=new Map();window.GM_getValue=(k,d)=>data.has(k)?data.get(k):d;window.GM_setValue=(k,v)=>data.set(k,v);window.GM_xmlhttpRequest=()=>{};window.__values=data;document.querySelector('#buy').onclick=()=>window.__bought=true;});
  await page.addScriptTag({content:source});await page.waitForFunction(()=>window.__ward?.App.lifecycle?.state==='enabled');
  assert.equal(await page.evaluate(()=>__ward.Retailer.key()),store);
  assert.deepEqual(await page.evaluate(()=>[{siteDarkMode:true},{siteDarkMode:false},{siteColors:'green'},{siteColors:'neon'}].map(v=>__ward.Settings.validate(v).siteColors)),['obsidian','off','green','off'],'the earlier switch migrates to Obsidian');
  assert.equal(await page.locator('html').getAttribute('data-exp-site-colors'),null);
  const photo=await page.locator('#photo').getAttribute('src');
  await page.evaluate(()=>__ward.Settings.update({siteColors:'obsidian'}));
  assert.equal(await page.locator('body').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(3, 6, 10)');
  assert.equal(await page.locator('input').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(26, 37, 48)');
  assert.equal(await page.locator('#photo').evaluate(n=>getComputedStyle(n).filter),'none');assert.equal(await page.locator('#photo').getAttribute('src'),photo);
  await page.evaluate(()=>document.querySelector('#later').innerHTML='<article id="dynamic">Later results</article>');
  assert.equal(await page.locator('#dynamic').evaluate(n=>getComputedStyle(n).color),'rgb(201, 215, 223)');
  await page.locator('#buy').click();assert.equal(await page.evaluate(()=>__bought),true);
  assert.equal(await page.evaluate(()=>__values.get('exp:v3:ward:settings').siteColors),'obsidian');
  await page.evaluate(()=>{__ward.UI.open();});
  await page.locator('#exp-ward-root').getByRole('tab',{name:'Look',exact:true}).click();
  const select=page.locator('#exp-ward-root').getByRole('combobox',{name:'Site colors',exact:true});
  assert.deepEqual(await select.locator('option').allTextContents(),['Off','Obsidian','Default','Indigo','Blue','Green','Red','Gray']);assert.equal(await select.inputValue(),'obsidian');
  await select.selectOption('blue');assert.equal(await page.locator('html').getAttribute('data-exp-site-palette'),'blue-light');assert.equal(await page.locator('body').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(231, 240, 251)');
  await select.selectOption('off');
  assert.equal(await page.locator('html').getAttribute('data-exp-site-colors'),null);
  assert.equal(await page.locator('body').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(255, 255, 255)');
  await select.selectOption('obsidian');await page.evaluate(()=>__ward.Settings.update({safeMode:true}));
  assert.equal(await page.locator('html').getAttribute('data-exp-site-colors'),null);
  await page.evaluate(()=>__ward.Settings.update({safeMode:false}));
  assert.equal(await page.locator('html').getAttribute('data-exp-site-colors'),'ward');
  if(store==='amazon'){const out=path.resolve(__dirname,'../../local-verification/ward-thread-20261020');fs.mkdirSync(out,{recursive:true});await page.screenshot({path:path.join(out,'ward-dark-mobile.png')});}
  await page.evaluate(()=>__ward.Settings.update({retailers:{...__ward.Settings.snapshot().retailers,[__ward.Retailer.key()]:false}}));
  assert.equal(await page.locator('html').getAttribute('data-exp-site-colors'),null);
  assert.deepEqual(errors,[]);await page.close();
 }
});
test('store-painted buttons and badges keep their own colors, and light palettes keep a header built around white artwork',async t=>{
 const browser=await chromium.launch();t.after(()=>browser.close());
 const page=await browser.newPage({viewport:{width:834,height:900},colorScheme:'light'});
 await page.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><head><style>body{background:#fff;color:#0f1111}#navbar{background:rgb(19,25,33);color:#fff}.a-button{display:inline-block;background:rgb(255,216,20)}.a-button-text{color:rgb(15,17,17)}.a-badge-region{background:rgb(0,0,0)}.a-badge-text{color:rgb(255,255,255)}</style></head><body><div id="navbar"><a href="/">Store home</a></div><main><span class="a-button"><span class="a-button-text">Add to cart</span></span><div class="a-badge-region"><span class="a-badge-text">Overall Pick</span></div><p id="copy">Product details</p></main></body></html>'}));
 await page.goto('https://www.amazon.com/s?k=fixture');
 await page.evaluate(()=>{const data=new Map();window.GM_getValue=(k,d)=>data.has(k)?data.get(k):d;window.GM_setValue=(k,v)=>data.set(k,v);window.GM_xmlhttpRequest=()=>{};});
 await page.addScriptTag({content:source});await page.waitForFunction(()=>window.__ward?.App.lifecycle?.state==='enabled');
 const look=()=>page.evaluate(()=>{const c=(s,p='color')=>getComputedStyle(document.querySelector(s))[p];return {header:c('#navbar','backgroundColor'),button:c('.a-button','backgroundColor'),buttonText:c('.a-button-text'),badge:c('.a-badge-region','backgroundColor'),badgeText:c('.a-badge-text'),copy:c('#copy')};});
 await page.evaluate(()=>__ward.Settings.update({siteColors:'blue'}));
 assert.deepEqual(await look(),{header:'rgb(19, 25, 33)',button:'rgb(255, 216, 20)',buttonText:'rgb(15, 17, 17)',badge:'rgb(0, 0, 0)',badgeText:'rgb(255, 255, 255)',copy:'rgb(32, 32, 36)'});
 await page.evaluate(()=>__ward.Settings.update({siteColors:'obsidian'}));
 assert.deepEqual(await look(),{header:'rgb(3, 6, 10)',button:'rgb(255, 216, 20)',buttonText:'rgb(15, 17, 17)',badge:'rgb(0, 0, 0)',badgeText:'rgb(255, 255, 255)',copy:'rgb(201, 215, 223)'});
});
