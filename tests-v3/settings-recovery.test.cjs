'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
test('WARD settings save and reload without accessing backup storage',()=>{
 const store=new Map(),access=[];
 const context=vm.createContext({EXP:{VERSION:'new-version'},ExtraPotionsCore:{cloneSettings:v=>JSON.parse(JSON.stringify(v))},location:{hostname:'example.com'},GM_getValue:(key,fallback)=>{access.push(key);if(key.includes('backup'))throw Error('Backup storage must not be read');return store.has(key)?store.get(key):fallback;},GM_setValue:(key,value)=>{access.push(key);if(key.includes('backup'))throw Error('Backup storage must not be written');store.set(key,value);}});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/settings.js'),'utf8'),context);
 const settings=context.EXP.Settings;settings.load();settings.update({safeMode:true},'change');settings.load();assert.equal(settings.snapshot().safeMode,true);
 const before=JSON.stringify(settings.snapshot());assert.throws(()=>settings.prepareImport({product:'wrong',generation:3,schema:1,settings:{}}));assert.equal(JSON.stringify(settings.snapshot()),before);
 assert.equal(access.some(key=>key.includes('backup')),false);assert.equal(settings.backup,undefined);assert.equal(settings.restoreBackup,undefined);
});
