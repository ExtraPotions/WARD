'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
test('settings load and edits do not depend on native cross-realm cloning',async t=>{
 const browser=await chromium.launch();t.after(()=>browser.close());const page=await browser.newPage();
 await page.goto('about:blank');
 const root=path.resolve(__dirname,'..');
 await page.addScriptTag({content:fs.readFileSync(path.join(root,'vendor/exp-core/exp-core.js'),'utf8')+'\nconst EXP={};'+fs.readFileSync(path.join(root,'src/settings.js'),'utf8')+'\nwindow.wardSettings=EXP.Settings;'});
 const result=await page.evaluate(()=>{window.structuredClone=()=>{throw Error('Foreign-realm clone unavailable');};wardSettings.load();wardSettings.update({enabled:false,categories:{'test-category':'off'}});const snapshot=wardSettings.snapshot();snapshot.categories['test-category']='on';return {enabled:wardSettings.snapshot().enabled,category:wardSettings.snapshot().categories['test-category']};});
 assert.deepEqual(result,{enabled:false,category:'off'});
});
