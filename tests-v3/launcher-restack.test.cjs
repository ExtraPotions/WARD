'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {loadSource}=require('./load-source.cjs');
const source=loadSource().replace('EXP.App.start();','globalThis.__wardUI=EXP.UI;EXP.App.start();');
assert.match(source,/globalThis\.__wardUI/);

for(const popovers of [true,false])test(`engine restacking preserves launcher protection (popovers=${popovers})`,async t=>{
  const browser=await chromium.launch();t.after(()=>browser.close());
  const page=await browser.newPage();
  await page.addInitScript(popovers=>{
    if(!popovers){HTMLElement.prototype.showPopover=undefined;HTMLElement.prototype.hidePopover=undefined;}
    window.GM_getValue=(key,fallback)=>fallback;window.GM_setValue=()=>{};
    window.GM_xmlhttpRequest=()=>({abort(){}});window.GM_registerMenuCommand=()=>{};
  },popovers);
  await page.route('**/*',route=>route.request().isNavigationRequest()?route.fulfill({contentType:'text/html',body:'<!doctype html><html><body><main>Amazon fixture</main></body></html>'}):route.abort());
  await page.goto('https://www.amazon.com/');await page.addScriptTag({content:source});
  await page.waitForSelector('#exp-ward-root',{state:'attached'});
  const result=await page.evaluate(()=>{
    const host=document.getElementById('exp-ward-root');
    if(typeof host.showPopover==='function')host.showPopover();
    const marker=document.createElement('div');marker.id='late-site-surface';document.documentElement.append(marker);
    const before=host.matches(':popover-open');
    for(let n=0;n<10;n++)__wardUI.restack();
    return{before,after:host.matches(':popover-open'),last:document.documentElement.lastElementChild===host,connected:host.isConnected};
  });
  assert.deepEqual(result,{before:popovers,after:popovers,last:!popovers,connected:true});
});
