'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const modules=['core.js','settings.js','patterns.js','audit.js','amazon-adapter.js','activity.js','page-styles.js','actions.js','layout.js','engine.js'];
const runtime=fs.readFileSync(path.join(root,'vendor/exp-core/exp-core.js'),'utf8')+'\nconst EXP={};'+modules.map(n=>fs.readFileSync(path.join(root,'src',n),'utf8')).join('\n')+'\nwindow.EXP=EXP;';
const prime='<div id="prime-promo" class="mobile-gateway-strategic_prime-retention-plan-switch-homepage-wd-widget-cx"><a href="#plan">Switch to an annual plan</a></div>';
const business='<div id="business-promo" data-card-metrics-id="abxs-yo-dsk-dynamic-upsell_yo-desktop-rightrail_0"><button>Switch to Business</button></div>';
const ad='<div id="ape_YourOrders_desktop-yo-footer-1_desktop_wrapper" class="ape-wrapper"><div id="ape_YourOrders_desktop-yo-footer-1_desktop_placement" class="ape-placement">Ad</div><span>Sponsored</span></div>';
async function setup(t,pathname,html){
 const browser=await chromium.launch({headless:true});t.after(()=>browser.close());const page=await browser.newPage();
 await page.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<!doctype html><html><body><main>'+html+'</main></body></html>'}));
 await page.goto('https://www.amazon.com'+pathname);await page.addScriptTag({content:runtime});await page.evaluate(()=>EXP.Settings.load());return page;
}
test('orders routes are explicit and ads plus Business upsells respect the global content action',async t=>{
 const page=await setup(t,'/your-orders/orders',business+ad+'<div class="order-card"><button id="track">Track</button><button id="return">Return</button></div>');
 const result=await page.evaluate(()=>{
  const routes=['/your-orders/orders','/your-orders/orders/ref=test','/gp/css/order-history','/gp/your-account/order-history'];
  const classes=routes.map(p=>EXP.AmazonAdapter.classify(p));
  EXP.Settings.update({contentAction:'hide'});EXP.Engine.start();
  const ids=['business-promo','ape_YourOrders_desktop-yo-footer-1_desktop_wrapper'];
  const hidden=ids.map(id=>document.getElementById(id).hidden);
  EXP.Settings.update({contentAction:'dim'});EXP.Engine.rebuild();
  const dim=ids.map(id=>{const n=document.getElementById(id);return {hidden:n.hidden,action:n.dataset.wardAction};});
  const controls=[...document.querySelectorAll('.order-card button')].every(n=>!n.closest('[hidden],[inert]'));
  EXP.Engine.stop();return {classes,hidden,dim,controls,restored:ids.every(id=>!document.getElementById(id).hasAttribute('data-ward-action'))};
 });
 assert.deepEqual(result.classes,Array(4).fill('orders'));assert.deepEqual(result.hidden,[true,true]);
 assert.deepEqual(result.dim,Array(2).fill({hidden:false,action:'dim'}));assert.equal(result.controls,true);assert.equal(result.restored,true);
});
test('homepage annual-plan promotion is isolated from ordinary homepage cards',async t=>{
 const page=await setup(t,'/',prime+'<div id="ordinary" data-card-metrics-id="single-creative-card_mobile-gateway-atf_0">Ordinary card</div>');
 const result=await page.evaluate(()=>{EXP.Engine.start();const n=document.getElementById('prime-promo');return {hidden:n.hidden,action:n.dataset.wardAction,ordinary:document.getElementById('ordinary').hasAttribute('data-ward-action')};});
 assert.deepEqual(result,{hidden:true,action:'collapse',ordinary:false});
});
test('order-card overlap never hides or dims order details even when an ad marker matches',async t=>{
 const page=await setup(t,'/gp/css/order-history','<div class="order-card">'+ad+'</div><div id="business-promo" data-card-metrics-id="abxs-yo-dsk-dynamic-upsell_yo-desktop-rightrail_0"><div class="js-order-card"><button id="track">Track</button></div></div>');
 const result=await page.evaluate(()=>{EXP.Settings.update({contentAction:'hide'});EXP.Engine.start();return ['ape_YourOrders_desktop-yo-footer-1_desktop_wrapper','business-promo'].map(id=>{const n=document.getElementById(id);return {hidden:n.hidden,action:n.dataset.wardAction};});});
 assert.deepEqual(result,Array(2).fill({hidden:false,action:'annotate'}));
});
