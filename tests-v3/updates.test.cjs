'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

test('update metadata returns only concise bullets from the latest release section', async () => {
  const storage = new Map();
  const context = {
    EXP: {
      VERSION: '3.2.2',
      Settings: { snapshot: () => ({ updateNotifications:true }) },
      Core: { safeError: (error) => { throw error; } }
    },
    localStorage: {
      getItem: (key) => storage.get(key) || null,
      setItem: (key,value) => storage.set(key,value)
    },
    GM_xmlhttpRequest: (options) => options.onload({
      status:200,
      responseText:JSON.stringify({
        tag_name:'v3.2.3',
        body:'## 3.2.3\n\n- First concrete change.\n- Second concrete change.\n\n## 3.2.2\n\n- Older change.'
      })
    }),
    Date, JSON, Object, String, Number, Array, Promise, Error
  };
  vm.runInNewContext(fs.readFileSync(path.join(root,'src','updates.js'),'utf8'),context);
  const result=await context.EXP.Updates.check(true);
  assert.equal(result.available,true);
  assert.equal(result.latest,'3.2.3');
  assert.deepEqual([...result.details],['First concrete change.','Second concrete change.']);
});
