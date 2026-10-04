'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),files=['core.js','settings.js','patterns.js','audit.js','retailers.js','amazon-adapter.js','activity.js','page-styles.js','actions.js','layout.js','engine.js'];
const runtime=fs.readFileSync(path.join(root,'vendor/exp-core/exp-core.js'),'utf8')+'\nconst EXP={};'+files.map(f=>fs.readFileSync(path.join(root,'src',f),'utf8')).join('\n')+';window.EXP=EXP;';
test('WARD suspends failing detection while keeping coupon quarantine separate',async t=>{const browser=await chromium.launch();t.after(()=>browser.close());const page=await browser.newPage();await page.route('**/*',r=>r.fulfill({body:'<html><body><main>Fixture</main></body></html>',contentType:'text/html'}));await page.goto('https://www.amazon.com/dp/fixture');await page.addScriptTag({content:runtime});
 const data=await page.evaluate(async()=>{EXP.Settings.load();const original=EXP.Retailer;let calls=0;EXP.Retailer={...original,detect(){calls++;throw Error('fixture');}};EXP.Engine.start();EXP.Engine.processBatch();EXP.Engine.processBatch();const before=calls;EXP.Engine.processBatch();const held=EXP.Engine.diagnostics().recovery;EXP.Retailer=original;await EXP.Engine.retry();return{held,before,after:calls,recovered:EXP.Engine.diagnostics().recovery};});
 assert.equal(data.held.suspended,true);assert.equal(data.after,data.before);assert.equal(data.recovered.suspended,false);
});
