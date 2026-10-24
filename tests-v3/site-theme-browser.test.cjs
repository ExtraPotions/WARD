'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
const {chromium}=require('playwright');
const source=require('../scripts/build.cjs').assembleSource().readable.replace('EXP.App.start();','window.__ward=EXP;EXP.App.start();');
const stores=[['amazon','https://www.amazon.com/dp/fixture'],['walmart','https://www.walmart.com/ip/fixture/1'],['ebay','https://www.ebay.com/itm/123'],['etsy','https://www.etsy.com/listing/123/fixture'],['target','https://www.target.com/p/fixture/-/A-123'],['bestbuy','https://www.bestbuy.com/site/fixture/123.p'],['shopify','https://fixture-store.example/products/fixture']];

test('Amazon themes paint under a restrictive style policy, switch palettes and restore native paint',async t=>{
 const browser=await chromium.launch();t.after(()=>browser.close());
 const page=await browser.newPage({colorScheme:'dark'});
 await page.route('**/*',r=>r.fulfill({headers:{'Content-Security-Policy':"style-src 'nonce-store'; script-src 'none'"},contentType:'text/html',body:'<!doctype html><style nonce="store">body,main{background:white;color:#111}button{background:#ffd814;color:#111}</style><main><h1>Product details</h1><button>Add to cart</button></main>'}));
 await page.goto('https://www.amazon.com/dp/fixture');
 await page.evaluate(()=>{window.GM_getValue=(k,d)=>d;window.GM_setValue=()=>{};window.GM_xmlhttpRequest=()=>{};});
 await page.evaluate(source);await page.waitForFunction(()=>window.__ward?.App.lifecycle?.state==='enabled');
 await page.evaluate(()=>__ward.Settings.update({siteColors:'red'}));
 assert.equal(await page.locator('main').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(32, 18, 20)','the palette must paint, not merely set a root marker');
 await page.evaluate(()=>__ward.Settings.update({siteColors:'blue'}));
 assert.equal(await page.locator('main').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(11, 20, 32)');
 await page.evaluate(()=>__ward.Settings.update({siteColors:'off'}));
 assert.equal(await page.locator('main').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(255, 255, 255)');
 assert.equal(await page.locator('#exp-site-colors-ward').count(),0);
});

test('page backgrounds and media links do not exempt Amazon content surfaces from theming',async t=>{
 const browser=await chromium.launch();t.after(()=>browser.close());
 const page=await browser.newPage({colorScheme:'dark'});
 await page.route('**/*',r=>r.fulfill({contentType:'text/html',body:`<!doctype html><style>body{background:linear-gradient(#eee,#ddd);color:#111}main,.card{background:white}#deck{background:linear-gradient(to right,rgb(240,242,242),rgb(255,255,255))}.carousel{color:#111}.photo{display:block;width:80px;height:60px;background:white}</style><main><img alt="" width="1" height="1"><div id="deck"><section class="carousel"><article class="card"><h2>Product details</h2><a href="/dp/other"><div class="photo"><img alt="Photo" width="60" height="40" style="display:block;width:60px;height:40px" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='40'/%3E"></div><p id="price">Product price</p><div class="_npack-asin-card_style_asin-metadata__fixture" style="mix-blend-mode:multiply"><span>Deal label</span></div></a><a class="_npack-asin-card_style_header-link__fixture" href="/dp/more"><svg width="20" height="20" fill="#0f1111"><path d="M0 0L20 10L0 20Z"/></svg></a></article></section></div></main>`}));
 await page.goto('https://www.amazon.com/');
 await page.evaluate(()=>{window.GM_getValue=(k,d)=>d;window.GM_setValue=()=>{};window.GM_xmlhttpRequest=()=>{};});
 await page.addScriptTag({content:source});await page.waitForFunction(()=>window.__ward?.App.lifecycle?.state==='enabled');
 await page.evaluate(()=>__ward.Settings.update({siteColors:'red'}));
 assert.equal(await page.locator('.card').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(49, 28, 33)');
 assert.equal(await page.locator('#price').evaluate(n=>getComputedStyle(n).color),'rgb(244, 244, 246)');
 assert.equal(await page.locator('.photo img').evaluate(n=>getComputedStyle(n).filter),'none');
 assert.equal(await page.locator('[class*="asin-metadata"]').evaluate(n=>getComputedStyle(n).mixBlendMode),'normal','deal text cannot multiply into a dark page');
 assert.equal(await page.locator('main svg path').evaluate(n=>getComputedStyle(n).fill),'rgb(244, 244, 246)','the monochrome card arrow follows its link');
 await page.locator('main a[class*="header-link"]').evaluate(n=>n.className='_multi-category-card_style_header-link__fixture');
 assert.equal(await page.locator('main svg path').evaluate(n=>getComputedStyle(n).fill),'rgb(244, 244, 246)','multi-category arrows also follow the palette');
 await page.evaluate(()=>__ward.Settings.update({siteColors:'off'}));
 assert.equal(await page.locator('[class*="asin-metadata"]').evaluate(n=>getComputedStyle(n).mixBlendMode),'multiply');
 assert.equal(await page.locator('main svg path').evaluate(n=>getComputedStyle(n).fill),'rgb(15, 17, 17)');
});

test('manager style injection still themes Amazon when constructed sheets cannot paint',async t=>{
 const browser=await chromium.launch();t.after(()=>browser.close());
 const page=await browser.newPage({colorScheme:'dark'});
 await page.route('**/*',r=>r.fulfill({headers:{'Content-Security-Policy':"style-src 'nonce-store'; script-src 'none'"},contentType:'text/html',body:'<!doctype html><style nonce="store">body,main{background:white;color:#111}</style><main><h1>Product details</h1></main>'}));
 await page.goto('https://www.amazon.com/');
 await page.evaluate(()=>{
  window.GM_getValue=(k,d)=>d;window.GM_setValue=()=>{};window.GM_xmlhttpRequest=()=>{};window.managerStyles=0;
  Object.defineProperty(Document.prototype,'adoptedStyleSheets',{configurable:true,get:()=>[],set:()=>{}});
  // Simulate the manager's privileged injection with a nonce accepted by the fixture.
  window.GM_addElement=(parent,tag,attrs)=>{const node=document.createElement(tag);node.nonce='store';node.textContent=attrs.textContent;parent.append(node);window.managerStyles++;return node;};
 });
 await page.evaluate(source);await page.waitForFunction(()=>window.__ward?.App.lifecycle?.state==='enabled');
 for(const [palette,bg]of [['red','rgb(32, 18, 20)'],['blue','rgb(11, 20, 32)']]){
  await page.evaluate(v=>__ward.Settings.update({siteColors:v}),palette);
  assert.equal(await page.locator('main').evaluate(n=>getComputedStyle(n).backgroundColor),bg);
 }
 assert.ok(await page.evaluate(()=>managerStyles)>0);
 await page.evaluate(()=>__ward.Settings.update({siteColors:'off'}));
 assert.equal(await page.locator('main').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(255, 255, 255)');
 assert.equal(await page.locator('#exp-site-colors-ward').count(),0);
 assert.match(source,/\/\/ @grant\s+GM_addElement/);
 assert.match(source,/\/\/ @grant\s+GM_addStyle/);
});
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
  assert.equal(await page.locator('input').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(26, 37, 48)','inputs use a readable palette surface');
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

function contrast(a,b){const lum=s=>{const c=s.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return c[0]*.2126+c[1]*.7152+c[2]*.0722;};const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
const mediaFixture=`<!doctype html><style>body,main{background:white;color:#111}body{font:16px system-ui}main{padding:16px}.media{width:240px;height:160px;position:relative}.media img{width:240px;height:160px}.overlay,.vjs-text-track-display{position:absolute;inset:0;background:transparent}.plate{background:white;width:240px}.plate img{width:160px;height:80px;mix-blend-mode:multiply}button,input{background:white;color:#111;padding:12px;border:1px solid #333}button svg{width:18px;height:18px;fill:#111}.a-button{background:#ffd814;color:#111}.badge{background:#cc0c39;color:white}#icon:hover{background:#eee}#icon:disabled{opacity:.5}.art{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='160'%3E%3Crect width='240' height='160' fill='%23123456'/%3E%3C/svg%3E");width:240px;height:160px;color:white}.art a{background:transparent;color:white}#story{position:relative;width:240px;height:160px}#story img{width:240px;height:160px}#story h2{position:absolute;top:0;color:white}</style><script id="shopify-features" type="application/json">{}</script><main><p>Product details</p><div class="media"><img alt="Product" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='160'%3E%3Crect width='240' height='160' fill='%23e85b35'/%3E%3C/svg%3E"><div class="overlay"><div class="vjs-text-track-display"></div></div><button id="media-open" style="position:absolute;inset:0;background:transparent;color:white;border:0">Open media</button></div><div class="plate"><div><img alt="Blended" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='80'%3E%3Crect width='160' height='80' fill='%2399ccff'/%3E%3C/svg%3E"></div></div><button id="icon"><svg><path d="M0 0H18V18H0Z"/></svg>Next</button><button class="a-button">Add to cart</button><span class="badge">25% off</span><input placeholder="Search"><div class="art"><span>Artwork label</span><a id="art-link" href="#">Explore</a></div><a id="story" href="#" style="display:block"><div><picture><img alt="Promotion" src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='160'%3E%3Crect width='240' height='160' fill='%23123456'/%3E%3C/svg%3E"></picture></div><h2>30% off</h2></a><div id="later"></div></main>`;
test('semantic purchase/status fills stay meaningful while neutral controls follow light and dark palettes',async t=>{
 const browser=await chromium.launch();t.after(()=>browser.close());const page=await browser.newPage({viewport:{width:1194,height:1500}});await page.route('**/*',r=>r.fulfill({contentType:'text/html',body:mediaFixture}));await page.goto('https://www.amazon.com/');await page.evaluate(()=>{window.GM_getValue=(k,d)=>d;window.GM_setValue=()=>{};window.GM_xmlhttpRequest=()=>{};});await page.addScriptTag({content:source});await page.waitForFunction(()=>window.__ward?.App.lifecycle?.state==='enabled');
 for(const scheme of ['dark','light']){await page.emulateMedia({colorScheme:scheme});await page.evaluate(()=>__ward.Settings.update({siteColors:'blue'}));for(const selector of ['.a-button','.badge','#icon','input']){const c=await page.locator(selector).evaluate(n=>({fg:getComputedStyle(n).color,bg:getComputedStyle(n).backgroundColor}));assert.ok(contrast(c.fg,c.bg)>=4.5,selector+' contrast '+JSON.stringify(c));}assert.equal(await page.locator('.a-button').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(255, 216, 20)');assert.equal(await page.locator('.badge').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(204, 12, 57)');}
});
test('all adapters and palettes preserve photo pixels, media transparency and overlaid labels, with dynamic cleanup',async t=>{
 const browser=await chromium.launch();t.after(()=>browser.close());
 for(const [store,url]of stores){const page=await browser.newPage({viewport:{width:1194,height:1500},colorScheme:'dark'});await page.route('**/*',r=>r.fulfill({contentType:'text/html',body:mediaFixture}));await page.goto(url);await page.evaluate(()=>{window.GM_getValue=(k,d)=>d;window.GM_setValue=()=>{};window.GM_xmlhttpRequest=()=>{};});await page.addScriptTag({content:source});await page.waitForFunction(()=>window.__ward?.App.lifecycle?.state==='enabled');const image=page.locator('.plate img'),src=await image.getAttribute('src');
 for(const scheme of ['dark','light']){await page.emulateMedia({colorScheme:scheme});for(const palette of ['obsidian','default','indigo','blue','green','red','gray']){await page.evaluate(v=>__ward.Settings.update({siteColors:v}),palette);for(const selector of ['.overlay','.vjs-text-track-display','#media-open'])assert.equal(await page.locator(selector).evaluate(n=>getComputedStyle(n).backgroundColor),'rgba(0, 0, 0, 0)',store+'/'+palette+' transparent media');assert.equal(await image.getAttribute('src'),src);assert.equal(await image.evaluate(n=>getComputedStyle(n).filter),'none');assert.equal(await image.evaluate(n=>getComputedStyle(n).mixBlendMode),'normal');assert.equal(await image.evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(255, 255, 255)','only the image rectangle retains its native photo backplate');assert.equal(await page.locator('.art span').evaluate(n=>getComputedStyle(n).color),'rgb(255, 255, 255)');assert.equal(await page.locator('#story h2').evaluate(n=>getComputedStyle(n).color),'rgb(255, 255, 255)');const c=await page.locator('#icon').evaluate(n=>({fg:getComputedStyle(n).color,bg:getComputedStyle(n).backgroundColor,svg:getComputedStyle(n.querySelector('path')).fill}));assert.ok(contrast(c.fg,c.bg)>=4.5,store+'/'+palette+' text');assert.ok(contrast(c.svg,c.bg)>=3,store+'/'+palette+' icon');}}
 const before=await page.locator('#icon').evaluate(n=>getComputedStyle(n).backgroundColor);await page.locator('#icon').hover();await page.waitForFunction(old=>getComputedStyle(document.querySelector('#icon')).backgroundColor!==old,before);await page.evaluate(()=>document.querySelector('#icon').disabled=true);assert.equal(await page.locator('#icon').evaluate(n=>getComputedStyle(n).opacity),'.5'.replace(/^\./,'0.'));
 await page.evaluate(()=>document.querySelector('#later').innerHTML='<button id="new-control" style="background:white!important;color:#111!important">Later control</button>');await page.waitForFunction(()=>document.querySelector('#new-control')?.hasAttribute('data-exp-ward-paint'));assert.notEqual(await page.locator('#new-control').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(255, 255, 255)');await page.evaluate(()=>__ward.Settings.update({siteColors:'off'}));assert.equal(await page.locator('[data-exp-ward-paint]').count(),0);assert.equal(await page.locator('#new-control').evaluate(n=>n.style.backgroundColor),'white');assert.equal(await page.locator('#new-control').evaluate(n=>n.style.getPropertyPriority('background-color')),'important');assert.equal(await image.evaluate(n=>getComputedStyle(n).backgroundColor),'rgba(0, 0, 0, 0)');await page.close();}
});
